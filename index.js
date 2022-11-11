const webdriver = require('selenium-webdriver');
const { Builder, By, Key, until } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const chromedriver = require('chromedriver');
const axios = require('axios');


const readline = require('readline');
readline.emitKeypressEvents(process.stdin);
process.stdin.setRawMode(true);
const rl = readline.createInterface({
	input: process.stdin,
	output: process.stdout
});

/* vvvvvvvvvvvv[CẤU HÌNH NỘI DUNG]vvvvvvvvvvvvvv */
const target_time = 1800000 //30 mins
var config = {
	"interval": 60000,
	"target_date": new Date().getTime() + target_time,
	"tds_token": `TDS0nI4IXZ2V2ciojIyVmdlNnIsICcqZHcqZ3Zu9GZiojIyV2c1Jye`,
};
/* ^^^^^^^^^^^^^[CẤU HÌNH NỘI DUNG]^^^^^^^^^^^^^ */

/* vvvvvvvvvvvv[CẤU HÌNH HTML]vvvvvvvvvvvvvv */
const login_link = 'https://facebook.com';

/* ^^^^^^^^^^^^[CẤU HÌNH HTML]^^^^^^^^^^^^^^ */

/* vvvvvvvvvvvv[KHỞI TẠO TRÌNH DUYỆT]vvvvvvvvvvvvvv */
chrome.setDefaultService(new chrome.ServiceBuilder(chromedriver.path).build());
const driver = new webdriver.Builder().withCapabilities(webdriver.Capabilities.chrome()).build();
/* ^^^^^^^^^^^^^[KHỞI TẠO TRÌNH DUYỆT]^^^^^^^^^^^^^ */


(async function example() { // Khởi tạo quá trình bất đồng bộ
	try {
		
		/* vvvvvvvvvvvvv[XỬ LÝ ĐĂNG NHẬP]vvvvvvvvvvvvv */
		await visit(login_link);	// Mở trang đăng nhập
		/* vvvvvvvvvvvvv[XỬ LÝ ĐĂNG NHẬP]vvvvvvvvvvvvv */

		/* ^^^^^^^^^^^^^^[XỬ LÝ INPUT]^^^^^^^^^^^^ */
		rl.question("Nhập chuỗi Token: ", async function (name) {

			config.tds_token = name;
			console.log('Chuỗi token của bạn là: ', config.tds_token)
			console.log('Thực hiện tác vụ kết nối Facebook (Y/N): ')

			process.stdin.on('keypress', async (str, key) => {
				if (str == 'Y') {
					/* vvvvvvvvvvvvv[XỬ LÝ TÁC VỤ AUTO LIKE/CMT - chạy target_time / nghỉ target_time]vvvvvvvvvvvvv */
					console.log('\n Mở kết nối tài khoản facebook');
					main();
					setInterval(() => {
						let now_date = new Date().getTime();
						if (now_date > config.target_date + target_time) {
							config.target_date += (target_time * 3)
							console.log('Reset Interval Function');
						} else if (now_date > config.target_date) console.log('Skip Interval Function');
						else if (now_date < config.target_date) {
							console.log('Interval Function Running')
							main();
						}

					}, config.interval)
					rl.close();
					/* vvvvvvvvvvvvv[XỬ LÝ TÁC VỤ AUTO LIKE/CMT - chạy target_time / nghỉ target_time]vvvvvvvvvvvvv */
				}
			})

		});

	}
	catch (ex) {
		console.log("Đã xảy ra lỗi: ", ex.toString())
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
			if (type == 'comment') await cmt(item.id, item.msg)
			else await like(item.id, type)
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