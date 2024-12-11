const express = require('express');
const bodyParser = require('body-parser');
const slackRoutes = require('./routes/slackRoutes');  // 슬랙 명령을 처리할 라우터
const app = express();
app.use(bodyParser.json());

app.use('/slack', slackRoutes);

const port = 3000;
app.listen(port, () => {
  console.log(`서버가 http://localhost:${port}에서 실행 중입니다.`);
});
