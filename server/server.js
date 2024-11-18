const Exporess = require('express');
const morgan = require('morgan');
const { readdirSync } = require('fs'); // อ่านไฟล์ในโฟลเดอร์ให้เป็น array (ชื่อไฟล์)
const cors = require('cors'); // อนุญาตให้ server กับ client สามารถส่งข้อมูลหากันได้
const App = Exporess();
const Port = 5001;

// Middleware
App.use(morgan('dev')); // log ของ api เมื่อถูกยิง request
App.use(Exporess.json()); // ทำให้สามารถรับข้อมูล json ได้ เช่น body
App.use(cors());

// Router 
readdirSync('./routes').forEach((file) =>  { // อ่านไฟล์จากโฟลเดอร์ routes แล้วทำเป็น route
    const routePath = `./routes/${file}`;
    App.use('/api', require(routePath));
});

// Start server
App.listen(Port,() => {
    console.log(`SERVER IS RUNNING ON PORT ${5001}`)
});