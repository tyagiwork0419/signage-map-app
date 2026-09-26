import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { imageSize } from 'image-size'

const BUCKET = 'map-images'

// フロアプラン画像のアップロード専用エンドポイント。
// Service Roleキー(RLSを完全にバイパスする)はここでしか使わない。
// edit_tokenの検証をこのハンドラ自身で行ってから初めてStorageへ書き込むことで、
// 「anonロールにStorageの直接書き込み権限を与えない」設計(migration参照)を成立させている。
export async function POST(request: NextRequest) {
  const formData = await request.formData()
  const editToken = formData.get('editToken')
  const file = formData.get('file')

  if (typeof editToken !== 'string' || !editToken || !(file instanceof File)) {
    return NextResponse.json({ error: 'invalid request' }, { status: 400 })
  }

  const url = process.env.SUPABASE_URL_INTERNAL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceKey) {
    return NextResponse.json({ error: 'server not configured' }, { status: 500 })
  }

  const admin = createClient(url, serviceKey)

  // edit_tokenの検証(Service Roleクライアントなので直接テーブルを見てよい)
  const { data: project, error: findError } = await admin
    .from('projects')
    .select('id')
    .eq('edit_token', editToken)
    .maybeSingle()

  if (findError || !project) {
    return NextResponse.json({ error: 'invalid token' }, { status: 403 })
  }

  const arrayBuffer = await file.arrayBuffer()
  const bytes = new Uint8Array(arrayBuffer)

  let dimensions: { width: number; height: number }
  try {
    dimensions = imageSize(bytes)
  } catch {
    return NextResponse.json({ error: 'unsupported image format' }, { status: 400 })
  }

  const ext = file.name.split('.').pop()?.toLowerCase() || 'png'
  const path = `${project.id}/${crypto.randomUUID()}.${ext}`

  const { error: uploadError } = await admin.storage
    .from(BUCKET)
    .upload(path, bytes, { contentType: file.type || undefined, upsert: false })

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 })
  }

  const { error: rpcError } = await admin.rpc('set_project_map_image', {
    token: editToken,
    image_path: path,
    image_width: dimensions.width,
    image_height: dimensions.height,
  })

  if (rpcError) {
    return NextResponse.json({ error: rpcError.message }, { status: 500 })
  }

  // 公開URLはブラウザから直接組み立てる(lib/supabase/storage.ts)ため、ここでは返さない。
  // admin(Service Role)クライアントで組み立てるとSUPABASE_URL_INTERNALベースになり、
  // ブラウザから届かないURLになってしまうため。
  return NextResponse.json({
    path,
    width: dimensions.width,
    height: dimensions.height,
  })
}
