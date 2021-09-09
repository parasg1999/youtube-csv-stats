const { default: axios } = require("axios");
const express = require("express");
const fileUpload = require("express-fileupload");
const fse = require("fs-extra");

const app = express();

app.use(fileUpload());

app.post("/", async (req, res) => {
  try {
    const { files } = req;
    let uploadPath = `./uploads/`;
    fse.ensureDirSync(uploadPath);
    uploadPath += `${files.file.name}`;

    await files.file.mv(uploadPath);

    const completeCSV = fse
      .readFileSync(uploadPath, { encoding: "utf-8" })
      .split("\r\n");

    let outputCSV = `Provided Name,Channel ID,Name of channel,Subscribers,Total Videos,Total Views`;
    let cerr = 0;
    let csuccess = 0;
    for (let index = 0; index < completeCSV.length; index++) {
      const elArr = completeCSV[index].split(",");
      let element = elArr.pop();
      if (element[element.length - 1] === "/") {
        element = element.substring(0, element.length - 1);
      }
      try {
        let channelId = element.split("/").pop();
        const informationResponse = await axios.get(
          `https://counts.live/api/youtube-subscriber-count/${channelId}/search`
        );

        const { name, picture, backdrop, id } =
          informationResponse.data.data[0];

        const subscriberResponse = await axios.get(
          `https://counts.live/api/youtube-subscriber-count/${id}/live`
        );

        const { subscribers, videos, views } = subscriberResponse.data.data;

        outputCSV += `\r\n${elArr[0]},${id},${name},${subscribers},${videos},${views},${picture}`;
        csuccess++;
      } catch (err) {
        console.log(err.message);
        cerr++;
      }
      console.log({ csuccess, cerr, element });
    }

    const downloadPath = `./uploads/output-file.csv`;

    fse.writeFileSync(downloadPath, outputCSV);

    return res.download(downloadPath);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ success: false });
  }
});

const PORT = process.env.PORT || 3014;

app.listen(PORT, () => {
  console.log(`Server started at port ${PORT}`);
});
