import type { NextApiRequest, NextApiResponse } from "next"
import { useEffect, useState } from "react"

import { createUploadthing, type FileRouter } from "uploadthing/next-legacy"
import { UploadThingError } from "uploadthing/server"

const f = createUploadthing()

const auth = (req: NextApiRequest, res: NextApiResponse) => ({ id: "fakeid" }) 

export const ourFileRouter = {


  
  imageUploader: f({ image: { maxFileSize: "4MB" } })
    .middleware(async ({ req, res }) => {
      const user = await auth(req, res)

      if (!user) throw new UploadThingError("Unauthorized")

      return { userId: user.id }
    })
    .onUploadComplete(async ({ metadata, file }) => {
      // This code RUNS ON YOUR SERVER after upload
      console.log("Upload complete for userId:", metadata.userId)

      console.log("file url", file.url)

      // !!! Whatever is returned here is sent to the clientside `onClientUploadComplete` callback
      return { uploadedBy: metadata.userId }
    }),
} satisfies FileRouter

export type OurFileRouter = typeof ourFileRouter
