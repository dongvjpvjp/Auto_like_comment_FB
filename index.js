const webdriver = require('selenium-webdriver');
const { Builder, By, Key, until } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const chromedriver = require('chromedriver');
const axios = require('axios');


const readline = require('readline');
readline.emitKeypressEvents(process.stdin);
process.stdin.setRawMode(true);


/* vvvvvvvvvvvv[CẤU HÌNH NỘI DUNG]vvvvvvvvvvvvvv */
const config = {
	"email": "account",
	"pass": "password",
	"interval": 30000,
	"delay": 5000,
	"tds_token": `TDS0nI4IXZ2V2ciojIyVmdlNnIsICcqZHcqZ3Zu9GZiojIyV2c1Jye`,
};
/* ^^^^^^^^^^^^^[CẤU HÌNH NỘI DUNG]^^^^^^^^^^^^^ */

/* vvvvvvvvvvvv[CẤU HÌNH HTML]vvvvvvvvvvvvvv */
const login_link = 'https://mbasic.facebook.com/login';

/* ^^^^^^^^^^^^[CẤU HÌNH HTML]^^^^^^^^^^^^^^ */

/* vvvvvvvvvvvv[KHỞI TẠO TRÌNH DUYỆT]vvvvvvvvvvvvvv */
chrome.setDefaultService(new chrome.ServiceBuilder(chromedriver.path).build());
const driver = new webdriver.Builder().withCapabilities(webdriver.Capabilities.chrome()).build();
/* ^^^^^^^^^^^^^[KHỞI TẠO TRÌNH DUYỆT]^^^^^^^^^^^^^ */


(async function example() { // Khởi tạo quá trình bất đồng bộ
	try {
		/*  */
		/* vvvvvvvvvvvvv[XỬ LÝ ĐĂNG NHẬP]vvvvvvvvvvvvv */
		await visit(login_link);	// Mở trang đăng nhập
		const emailInput = await findByName('email');	// tìm vị trí nhập email
		const passInput = await findByName('pass');	// tìm vị trí nhập password
		const loginButton = await findByName('login');	// tìm vị trí nút login
		await write(emailInput, config.email);	//Điền email
		await write(passInput, config.pass);	// Điền password
		await loginButton.click(); // Nhấp đăng nhập

		/* ^^^^^^^^^^^^^^[XỬ LÝ AUTO LIKE / CMT]^^^^^^^^^^^^ */
		console.log('Thực hiện tác vụ Y/N ')
		process.stdin.on('keypress', (str, key) => {
			if (str == 'Y') {
				console.log('Bắt đầu chạy')
				main();
				setInterval( () => {
					 main();
				}, config.interval)
				// main();
			}
		})


	} finally {
		// quit();	// Thoát trình duyệt 
		process.stdin.on('keypress', (str, key) => {
			if (str == 'N') {
				console.log('Ngưng hệ thống')
				quit();
			}
		})
	}
})();


// visit a webpage
async function visit(theUrl) {
	return await driver.get(theUrl);
};

// quit current session
async function quit() {
	return await driver.quit();
};

// wait and find a specific element with it's id
async function findById(id) {
	await driver.wait(until.elementLocated(By.id(id)), 15000, 'Looking for element');
	return await driver.findElement(By.id(id));
};

// wait and find a specific element with it's name
async function findByName(name) {
	await driver.wait(until.elementLocated(By.name(name)), 15000, 'Looking for element');
	return await driver.findElement(By.name(name));
};
async function findbyCSS(name) {
	await driver.wait(until.elementLocated(By.css(name)), 15000, 'Looking for element');
	return await driver.findElement(By.css(name));
};


// fill input web elements
async function write(el, txt) {
	return await el.sendKeys(txt);
};

async function like(id, type) {
	try {
		await visit(`https://mbasic.facebook.com/${id}`);
		const like_button = await findbyCSS("a[href*='/a/like.php']:first-of-type");
		await like_button.click();
		console.log('Truy cập và like bài viết', id)
		await getCoin(type, id);
	}
	catch (err) {
		console.log('err', err);
		// await like(id);
	}
}

async function cmt(id, msg) {
	try {
		await visit(`https://mbasic.facebook.com/${id}`);
		let input = await findByName('comment_text');
		await write(input, msg);
		let cmt_button = await findbyCSS("input[value='Bình luận']:first-of-type");
		await cmt_button.click();
		console.log('Truy cập và cmt bài viết', id, 'với msg', msg)
		await getCoin('comment', id);
	} catch (err) {
		console.log('err', err);
	}
}

async function handler(type) {
	try {
		let list = await axios.get(`https://traodoisub.com/api/?fields=${type}&access_token=${config.tds_token}`)
		if (!list?.data?.length) {
			console.log('Chạy API Lấy danh sách nhiệm vụ facebook thất bại', type, list.data);
			return false
		}
		console.log('Chạy API Lấy danh sách nhiệm vụ facebook, response', type, list.data);
		let i = 1;
		for await (let item of list.data) {
			// setTimeout(async () => {
				if (type == 'comment') await cmt(item.id, item.msg)
				else await like(item.id, type)
			// }, i++ * config.delay)
		}
		return true;
	} catch (ex) {
		console.log('err', ex)
	}
}
async function getCoin(type, id) {
	try {
		let res = await axios.get(`https://traodoisub.com/api/coin/?type=${type.toUpperCase()}&id=${id}&access_token=${config.tds_token}`)
		if (!res?.data?.error) console.log('Chạy API nhận xu thành công, response', res.data);
	} catch (ex) {
		console.log('err', ex)
		console.log('Chạy API nhận xu thất bại, response', res.data);
		await getCoin(type, id)
	}
}
async function main() {
	let res = await handler(`comment`);
	if (!res) res = await handler(`like`);
	if (!res) res = await handler(`likegiare`);
	if (!res) res = await handler(`likesieure`);
}