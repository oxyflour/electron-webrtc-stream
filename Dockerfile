FROM node:slim
RUN apt-get update
RUN apt-get -y install libgtkextra-dev libgconf2-dev libnss3 libasound2 libxtst-dev libxss1
ADD ./package* ./
ADD ./index.js ./
RUN npm install
CMD ["npx", "electron", "."]
