const { App } = require('@slack/bolt');
require('dotenv').config();
const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  socketMode: true,
  appToken: process.env.SLACK_APP_TOKEN
});

const member = new Set();

let dinnerMessageTs = null;

app.command('/저녁', async ({ ack, body, say, logger }) => {
  await ack();
  
  member.clear();
  
  const result = await say({
    blocks: [
      {
        "type": "section",
        "text": {
          "type": "mrkdwn",
          "text": "저녁 드실 분은 5시 전까지 ✅ 이모지를 눌러주세요!"
        }
      }
    ],
    text: "저녁 드실 분~"
  });
  
  dinnerMessageTs = result.ts;
});

app.event('reaction_added', async ({ event, client }) => {
  if (event.item.ts === dinnerMessageTs) {
    try {
      if (event.reaction === 'white_check_mark') {
        const userInfo = await client.users.info({
          user: event.user
        });
        
        member.add({
          name: userInfo.user.real_name
        });
      }
    } catch (error) {
      console.error('Error:', error);
    }
  }
});

app.command('/뽑기', async ({ ack, say, body, client }) => {
  await ack();

  if (member.size === 0) {
    await say("저녁 드실 분이 없습니다!");
    return;
  }

  try {
    const memberArray = Array.from(member);
    const randomMember = memberArray[Math.floor(Math.random() * memberArray.length)];
    
    await say({
      blocks: [
        {
          "type": "section",
          "text": {
            "type": "mrkdwn",
            "text": `🎉 ${randomMember.name}님이 선택되었습니다! 메뉴를 골라주세요~`
          }
        },
      ],
      text: `🎉 ${randomMember.name}님이 선택되었습니다! 메뉴를 골라주세요~`
    });
    
    // Clear the list after picking
    member.clear();

  } catch (error) {
    console.error('Error:', error);
    await say("오류 발생 !");
  }
})



const start = async () => {
  // Start your app
  await app.start();

  console.log('⚡️ 슬랙 봇 실행중 !');
};

start();