import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'

// Cloudflare R2 expone una API compatible con S3 — mismo SDK, solo cambia el
// endpoint (por cuenta) y la región fija 'auto'. Ver lib/media.ts para cuándo
// se usa este backend vs. disco local.
function getClient(): S3Client {
  return new S3Client({
    region: 'auto',
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID!,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    },
  })
}

export async function putObjectR2(key: string, body: Buffer, contentType: string): Promise<void> {
  const client = getClient()
  await client.send(new PutObjectCommand({
    Bucket: process.env.R2_BUCKET,
    Key: key,
    Body: body,
    ContentType: contentType,
    CacheControl: 'public, max-age=31536000, immutable',
  }))
}
