FROM node:22

ENV NODE_ENV=production
ENV MONGO_URI=mongodb+srv://Judicael:mongodbConnect@cluster0.c6ycdle.mongodb.net/KSHOP
ENV PORT=3000
ENV CLOUDINARY_CLOUD_NAME=dy7mzsgdm
ENV CLOUDINARY_API_KEY=346482481636392
ENV CLOUDINARY_API_SECRET=j14hMSHBzGy2Y5kzH1EnIpZrLh4
ENV SENDGRID_API_KEY=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
ENV EMAIL_SENDER=chrisjudiv@gmail.com
ENV JWT_SECRET=@KSHOP#2020



WORKDIR /app

COPY ["package.json", "package-lock.json*", "./"]

RUN npm install

COPY . .

EXPOSE 3000

CMD [ "node", "app.js" ]