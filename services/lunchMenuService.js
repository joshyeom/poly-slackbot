const mysql = require('mysql2');

// MySQL 연결 설정
const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '950316',
  database: 'lunch_menu'
});

// 메뉴 항목 추가
exports.addMenuItem = (item_name, category, callback) => {
  const query = 'INSERT INTO LUNCH_MENU (item_name, category) VALUES (?, ?)';
  connection.query(query, [item_name, category], (err, results) => {
    if (err) {
      return callback(err);
    }
    callback(null, results);
  });
};
