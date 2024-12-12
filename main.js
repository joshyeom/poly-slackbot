const { App } = require('@slack/bolt');
require('dotenv').config();
const mysql = require('mysql2/promise');
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});

const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  socketMode: true,
  appToken: process.env.SLACK_APP_TOKEN
});

const member = new Set();

let dinnerMessageTs = null;

const scehdule = require('node-schedule');


scehdule.scheduleJob('15 9 * * 1-5', async () => {

  member.clear()
  try {
      const result = await app.client.chat.postMessage({
          channel: 'C07TJLG6YHL',  
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
  } catch (error) {
      console.error('Error sending message:', error);
  }
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

app.event('reaction_removed', async ({ event, client }) => {
  if (event.item.ts === dinnerMessageTs) {
    try {
      if (event.reaction === 'white_check_mark') {
        const userInfo = await client.users.info({
          user: event.user
        });
        
        member.forEach(m => {
          if (m.name === userInfo.user.real_name) {
            member.delete(m);
          }
        });
      }

    } catch (error) {
      console.error('Error:', error);
    }
  }
});

app.command('/뽑기', async ({ ack, client, body }) => {
  await ack();
  try {
    if (member.size === 0) {
        await client.chat.postMessage({
        channel: 'C07TJLG6YHL',
        text: "저녁 드실 분이 없습니다!"
      });
      return
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
    
  } catch (error) {
    await say("오류 발생 !");
    };
  } catch (error) {
    console.error('Error:', error);
  }
});


scehdule.scheduleJob('00 17 * * 1-5', async () => {
  try {
    if (member.size === 0) {
        await client.chat.postMessage({
        channel: 'C07TJLG6YHL',
        text: "저녁 드실 분이 없습니다!"
      });
      return
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
    
  } catch (error) {
    await say("오류 발생 !");
    };
  } catch (error) {
    console.error('Error:', error);
  }
});

app.command('/메뉴추가', async ({ ack, client, body }) => {
  await ack();
  
  try {
    await client.views.open({
      trigger_id: body.trigger_id,
      view: {
        type: 'modal',
        callback_id: 'menu_submission',
        title: {
          type: 'plain_text',
          text: '식당 추가'
        },
        blocks: [
          {
            type: 'input',
            block_id: 'item_name',
            element: {
              type: 'plain_text_input',
              action_id: 'item_name_input',
              placeholder: {
                type: 'plain_text',
                text: '예: 소한마리'
              }
            },
            label: {
              type: 'plain_text',
              text: '식당 이름'
            }
          },
          {
            type: 'input',
            block_id: 'category',
            element: {
              type: 'radio_buttons',
              action_id: 'category_input',
              options: [
                {
                  text: {
                    type: 'plain_text',
                    text: '한식'
                  },
                  value: '한식'
                },
                {
                  text: {
                    type: 'plain_text',
                    text: '중식'
                  },
                  value: '중식'
                },
                {
                  text: {
                    type: 'plain_text',
                    text: '일식'
                  },
                  value: '일식'
                },
                {
                  text: {
                    type: 'plain_text',
                    text: '양식'
                  },
                  value: '양식'
                },
                {
                  text: {
                    type: 'plain_text',
                    text: '기타 메뉴'
                  },
                  value: '기타 메뉴'
                },
              ]
            },
            label: {
              type: 'plain_text',
              text: '음식 카테고리'
            }
          },
        ],
        submit: {
          type: 'plain_text',
          text: '저장'
        }
      }
    });
  } catch (error) {
    console.error('Error:', error);
  }
});


app.view('menu_submission', async ({ ack, body, view, client }) => {
  await ack();

  try {
    const values = view.state.values;
    const itemName = values.item_name.item_name_input.value;
    const category = values.category.category_input.selected_option.value;
    const userName = body.user.name;
    
    if(userName === "hyemi.choi" || userName === "jm.kim"){
      await client.chat.postMessage({
        channel: body.user.id,
        text: '❌ 벤입니다 ㅅㄱ'
      });
      return;
    }



    const checkQuery = 'SELECT COUNT(*) AS count FROM lunch_menu WHERE item_name = ?';
    const [rows] = await pool.execute(checkQuery, [itemName]);
    
    if (rows[0].count === 0) {
      const insertQuery = 'INSERT INTO lunch_menu (item_name, category, user_name) VALUES (?, ?, ?)';
      await pool.execute(insertQuery, [itemName, category, userName]);
    } else {
      await client.chat.postMessage({
        channel: body.user.id,
        text: '❌ 이미 존재하는 메뉴입니다.'
      });
      return
    }


    const query = 'INSERT INTO lunch_menu (item_name, category, user_name) VALUES (?, ?, ?)';

    await client.chat.postMessage({
      channel: body.user.id,
      text: `✅ 새로운 메뉴가 추가되었습니다!\n*메뉴:* ${itemName}\n*카테고리:* ${category}`
    });

  } catch (error) {
    console.error('Error:', error);
    await client.chat.postMessage({
      channel: body.user.id,
      text: '❌ 메뉴 추가 중 오류가 발생했습니다.'
    });
  }
});

scehdule.scheduleJob('00 11 * * 1-5', async () => {
  const query = 'SELECT * FROM lunch_menu ORDER BY RAND() LIMIT 1';
  try {
    const [rows] = await pool.execute(query);

    if (rows.length === 0) {
      await client.chat.postMessage({
        channel: body.user_id,
        text: '❌ 추천할 메뉴가 없습니다. 메뉴 추가해주세요!'
      });
      return;
    }

    const randomMenu = rows[0];

    await client.chat.postMessage({
      channel: body.channel_id,
      text: ` 오늘의 점심 추천 메뉴는 🍴${randomMenu.item_name}🍴입니다!`
    });
  } catch (error) {
    console.error('Database Query Error:', error);
    await client.chat.postMessage({
      channel: body.user_id,
      text: '❌ 데이터베이스 오류가 발생했습니다.'
    });
  }
});

app.command('/메뉴', async ({ ack, client, body }) => {
  await ack();

  try {
    const query = 'SELECT item_name, category FROM lunch_menu';
    const [rows] = await pool.execute(query);

    const groupedItems = rows.reduce((acc, row) => {
      if (!acc[row.category]) {
        acc[row.category] = [];
      }
      acc[row.category].push(row.item_name);
      return acc;
    }, {});

    const blocks = [];
    for (const [category, items] of Object.entries(groupedItems)) {
      blocks.push({
        type: 'header',
        text: {
          type: 'plain_text',
          text: category
        }
      });
      items.forEach(item => {
        blocks.push({
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*${item}*`
          },
        });
      });
    }

    await client.views.open({
      trigger_id: body.trigger_id,
      view: {
        type: 'modal',
        callback_id: 'menu_view',
        title: {
          type: 'plain_text',
          text: 'Lunch Menu'
        },
        blocks: blocks,
        close: {
          type: 'plain_text',
          text: 'Close'
        }
      }
    });
  } catch (error) {
    console.error('Error:', error);
  }

});

const start = async () => {
  await app.start();

  console.log('⚡️ 슬랙 봇 실행중 !');
};

start();