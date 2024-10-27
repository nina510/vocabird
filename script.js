let ieltsWords = [];

function loadWordsFromJSON() {
    fetch('output.json')
        .then(response => response.json())
        .then(data => {
            ieltsWords = data;
            totalWords = ieltsWords.length;
            console.log('Words loaded successfully:', ieltsWords);
            initGame();
        })
        .catch(error => {
            console.error('Error loading words:', error);
            alert('Failed to load words. Please refresh the page and try again.');
        });
}

let gameStarted = false;
let lastTime = 0;
const keys = {};
let canvas, ctx;
let gameLoopId;  // 改为 let 声明

let usedWords = [];
let player, obstacles, coins, score;

let coinCount = 0;

// 修改游戏速
const gameSpeed = 100; // 速度从200降到100

// 在全局变量区域添加
let totalWords = 0;
let usedWordsCount = 0;

// 在全局变量区域添加或修改以下变量
let wordsPerRound = 30;
let currentRoundWords = [];
let passedWords = 0;

// 修改全局变量
let coinsToWin = 30;

let currentSpeed = 100; // 初始速度
const minSpeed = 50;    // 最小速度
const maxSpeed = 500;   // 最速度从300改为500
const speedStep = 10;   // 每次按键改变的速度

// 在全局变量区域添加
let initialSpeed = 100; // 初始速度

// 在文件顶部添加音频对象
const congratsAudio = new Audio('congratulation_music.mp3');

// 在全局变量区域添加
let congratsAudioLoop;

// 在全局变量区域添加
let collidedObstacles = [];

// 在全局变量区域添加
let recentlyCollidedWords = [];
const collisionCooldown = 5; // 碰撞后多少个障碍物内不会再次出现

// 在全局变量区域添加
let lastCollidedWord = null;

// 在全局变量区域添加
let collectedWords = [];

// 修改默认小鸟颜色为浅黄色
let currentBirdColor = '#FFFF99'; // 

// 修改 birdColors 数组
const birdColors = [
    { name: 'Sunny', color: '#FFFF99', price: 0 },
    { name: 'Oreo', color: '#000000', price: 10 },
    { name: 'Pinky', color: '#FFB6C1', price: 50 },
    { name: 'Sky', color: '#87CEEB', price: 100 },
    { name: 'Leafy', color: '#90EE90', price: 150 },
    { name: 'Grape', color: '#DDA0DD', price: 200 },
    { name: 'Mango', color: '#FFA500', price: 250 },
    { name: 'Ruby', color: '#E0115F', price: 300 },
    { name: 'Aqua', color: '#00FFFF', price: 350 },
    { name: 'Lime', color: '#32CD32', price: 400 },
    { name: 'Peach', color: '#FFDAB9', price: 450 },
    { name: 'Lilac', color: '#C8A2C8', price: 500 },
    { name: 'Coral', color: '#FF7F50', price: 550 },
    { name: 'Mint', color: '#98FF98', price: 600 }
];

let purchasedBirds = ['#FFFF99']; // 初始黄色小鸟默认已购买

let isPaused = false;

// 在全局变量区域添加
let appearedWordsCount = 0;

// 添加一个全局变量来跟踪是否正在显示恭喜界面
let isShowingCongrats = false;

// 在全局区域添加振动功能检查
const canVibrate = window.navigator.vibrate;

function getRandomWord() {
    if (ieltsWords.length === 0) {
        console.error('No words loaded');
        return { word: "Error", cn: "单词加失败" };
    }
    if (usedWords.length >= ieltsWords.length * 0.7) {
        usedWords = [];
        usedWordsCount = 0;
    }
    
    let availableWords = ieltsWords.filter(word => !usedWords.includes(word));
    let randomWord = availableWords[Math.floor(Math.random() * availableWords.length)];
    
    usedWords.push(randomWord);
    usedWordsCount++;
    updateProgressBar();
    return randomWord;
}

// 确保游戏只在单词加载完成后开始
function startGame() {
    if (ieltsWords.length === 0) {
        alert('Words are still loading. Please wait.');
        return;
    }
    console.log('startGame function called');
    gameStarted = true;
    document.getElementById('startButton').style.display = 'none';
    lastTime = 0;
    gameLoopId = requestAnimationFrame(gameLoop);
    console.log('Game loop started');
    congratsAudio.play().then(() => {
        congratsAudio.pause();
        congratsAudio.currentTime = 0;
    }).catch(e => console.log("Audio play failed:", e));
}

function gameLoop(currentTime) {
    if (!gameStarted) return;

    if (isPaused) {
        lastTime = currentTime;
        requestAnimationFrame(gameLoop);
        return;
    }

    if (!lastTime) lastTime = currentTime;
    const deltaTime = (currentTime - lastTime) / 1000;
    console.log('Delta time:', deltaTime);

    updateGame(deltaTime);
    drawGame();

    lastTime = currentTime;
    gameLoopId = requestAnimationFrame(gameLoop);
}

function updateGame(deltaTime) {
    console.log('Updating game');
    movePlayer(deltaTime);
    moveObstacles(deltaTime);
    moveCoins(deltaTime);
    checkCollision();
    checkCoinCollection();
    updateScore(deltaTime);
    
    // 更新翅膀角度
    player.wingAngle += deltaTime * 15; // 增加这个值会加快翅膀扇速度
    if (player.wingAngle > Math.PI * 2) {
        player.wingAngle -= Math.PI * 2;
    }
    
    // 移除改变喙方向的代码
    // if (Math.random() < deltaTime / 2) {
    //     changeBeakDirection();
    // }
}

function drawGame() {
    if (!isPaused) {
        console.log('Drawing game');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    drawPlayer();
    drawObstacles();
    drawCoins();
    console.log('Player drawn at', player.x, player.y);
}

document.addEventListener('DOMContentLoaded', function() {
    canvas = document.getElementById('gameCanvas');
    if (!canvas) {
        console.error('Canvas element not found');
        return;
    }
    ctx = canvas.getContext('2d');
    console.log('Canvas initialized');
    loadWordsFromJSON();
    updateBirdShop(); // 添加这一行
});

function initGame() {
    canvas = document.getElementById('gameCanvas');
    ctx = canvas.getContext('2d');
    player = { 
        x: canvas.width / 2 - 15,
        y: canvas.height / 2 - 15,
        width: 40,
        height: 30, 
        speed: 200,
        wingAngle: 0
        // 移除 beakDirection 属性
    };
    obstacles = [];
    coins = [];
    score = 0;
    coinCount = 0;
    updateCoinDisplay();
    usedWordsCount = 0;
    updateProgressBar();
    currentRoundWords = getRandomWords(wordsPerRound);
    passedWords = 0;
    updateProgressBar();
    currentSpeed = 100;
    updateSpeedDisplay();
    collectedWords = [];
    updateCollectedWordsList();
    updateBirdShop(); // 添加一行
    purchasedBirds = ['#FFFF99']; // 重置已买的小鸟列表
    currentBirdColor = '#FFFF99'; // 重置当前小鸟颜色
    setupCopyAllWordsButton();
    appearedWordsCount = 0;
    updateWordCount();
}

// 在这里添加其他缺失数的义

function movePlayer(deltaTime) {
    const moveDistance = player.speed * deltaTime;
    if (keys.ArrowUp && player.y > 0) player.y -= moveDistance;
    if (keys.ArrowDown && player.y < canvas.height - player.height) player.y += moveDistance;
    
    // 保持玩家在水平中心
    player.x = canvas.width / 2 - player.width / 2;

    // 控制速度
    if (keys.ArrowLeft) {
        decreaseSpeed();
    } else if (keys.ArrowRight) {
        increaseSpeed();
    } else {
        // 当没有按下左右键时，立即恢复到初始速度
        resetSpeed();
    }
}

function moveObstacles(deltaTime) {
    obstacles.forEach(obstacle => {
        obstacle.x -= currentSpeed * deltaTime;
        if (obstacle.x + obstacle.width < player.x && !obstacle.passed) {
            obstacle.passed = true;
            passedWords++;
            updateProgressBar();
            checkGameCompletion();
        }
    });

    // 移除离开屏幕的障碍物
    obstacles = obstacles.filter(obstacle => obstacle.x + obstacle.width > 0);

    // 成障碍物
    const lastObstacle = obstacles[obstacles.length - 1];
    if (!lastObstacle || lastObstacle.x < canvas.width - 600) {
        generateObstacle();
    }
}

function moveCoins(deltaTime) {
    coins.forEach(coin => {
        coin.x -= currentSpeed * deltaTime; // 使 currentSpeed
    });

    // 移除离开屏的金币
    coins = coins.filter(coin => coin.x + coin.width > 0);

    // 生成新的金币
    if (coins.length < 3 && Math.random() < 0.02) {
        generateCoin();
    }
}

function checkCollision() {
    for (let i = 0; i < obstacles.length; i++) {
        let obstacle = obstacles[i];
        // 查与主圆形的碰撞
        const centerX = obstacle.x + obstacle.width / 2;
        const centerY = obstacle.y + obstacle.height / 2;
        const mainRadius = Math.min(obstacle.width, obstacle.height) * 0.3;

        if (checkCircleCollision(player, centerX, centerY, mainRadius)) {
            showWordReview(obstacle.word);
            // 将碰的云朵移动到画面外并添加到最近碰撞列表
            obstacle.x = canvas.width + obstacle.width;
            recentlyCollidedWords.push(obstacle.word);
            lastCollidedWord = obstacle.word; // 记录最后碰撞的单词
            return true;
        }

        // 检查与额外圆形撞
        for (let circle of obstacle.circles) {
            const circleCenterX = centerX + circle.x;
            const circleCenterY = centerY + circle.y;
            if (checkCircleCollision(player, circleCenterX, circleCenterY, circle.radius)) {
                showWordReview(obstacle.word);
                // 将碰撞的云朵移动到画面外并添加到最近碰撞列表
                obstacle.x = canvas.width + obstacle.width;
                recentlyCollidedWords.push(obstacle.word);
                lastCollidedWord = obstacle.word; // 记录最后碰撞的单词
                return true;
            }
        }
    }
    return false;
}

function checkCoinCollection() {
    coins = coins.filter(coin => {
        if (player.x < coin.x + coin.width &&
            player.x + player.width > coin.x &&
            player.y < coin.y + coin.height &&
            player.y + player.height > coin.y) {
            coinCount++;
            updateCoinDisplay();
            updateProgressBar();
            checkGameCompletion();
            
            // 添加振动反馈
            if (canVibrate) {
                window.navigator.vibrate(50); // 振动50毫秒
            }
            
            console.log('Coin collected. New coin count:', coinCount);
            return false;
        }
        return true;
    });
}

function updateScore(deltaTime) {
    score += deltaTime * 5; // 从10减少到5，使分数增长速度减半
    document.getElementById('score').textContent = `DISTANCE: ${Math.floor(score)} M`;
}

function drawPlayer() {
    // 清除玩家原来的位置
    ctx.clearRect(player.x, player.y, player.width, player.height);

    ctx.save();
    ctx.translate(player.x + player.width / 2, player.y + player.height / 2);
    
    // 绘制身体
    ctx.fillStyle = currentBirdColor;
    ctx.beginPath();
    ctx.ellipse(0, 0, player.width / 2, player.height / 2, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // 绘制翅膀（扇动效果）
    ctx.fillStyle = adjustColor(currentBirdColor, -20); // 稍微深一点的颜色
    ctx.save();
    ctx.rotate(Math.sin(player.wingAngle) * 0.3); // 翅膀旋转
    ctx.beginPath();
    ctx.ellipse(-player.width / 4, 0, player.width / 3, player.height / 4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    
    // 绘制眼睛
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.arc(player.width / 4, -player.height / 8, player.width / 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'black';
    ctx.beginPath();
    ctx.arc(player.width / 4 + player.width / 16, -player.height / 8, player.width / 16, 0, Math.PI * 2);
    ctx.fill();
    
    // 绘制鸟嘴
    ctx.fillStyle = '#FFA500'; // 橙色
    ctx.beginPath();
    ctx.moveTo(player.width / 2, -player.height / 16);
    ctx.lineTo(player.width * 3/4, 0);
    ctx.lineTo(player.width / 2, player.height / 16);
    ctx.closePath();
    ctx.fill();
    
    ctx.restore();
}

function drawObstacles() {
    obstacles.forEach(obstacle => {
        ctx.fillStyle = 'white';
        
        const centerX = obstacle.x + obstacle.width / 2;
        const centerY = obstacle.y + obstacle.height / 2;

        // 绘制主要的圆形
        const mainRadius = Math.min(obstacle.width, obstacle.height) * 0.4;
        ctx.beginPath();
        ctx.arc(centerX, centerY, mainRadius, 0, Math.PI * 2);
        ctx.fill();

        // 绘制额外的圆形来创更自然的云朵形状
        obstacle.circles.forEach(circle => {
            ctx.beginPath();
            ctx.arc(centerX + circle.x, centerY + circle.y, circle.radius, 0, Math.PI * 2);
            ctx.fill();
        });

        // 计算云朵的实际边界
        const cloudBoundary = calculateCloudBoundary(obstacle);

        // 检查单词是否在屏幕中间
        const screenCenterX = canvas.width / 2;
        if (Math.abs(centerX - screenCenterX) < 5 && !obstacle.hasSpoken) {
            speakWord(obstacle.word.word);
            obstacle.hasSpoken = true;
        }

        // 绘制单词
        if (obstacle.word && obstacle.textOffset.calculated) {
            ctx.fillStyle = 'black';
            
            // 使用存储的偏移量计算文字位置，并向右偏移
            const textOffsetX = 40; // 向右偏移的距离
            const centerX = obstacle.x + obstacle.textOffset.x + textOffsetX; // 添加水平偏移
            const centerY = obstacle.y + obstacle.textOffset.y;
            
            // 计算可用空间
            const availableWidth = obstacle.width * 0.7;
            
            // 绘制英文单词
            let fontSize = 24;
            ctx.font = `bold ${fontSize}px Arial`;
            let englishText = obstacle.word.word;
            let englishMetrics = ctx.measureText(englishText);
            
            // 如果单词太长，缩小字体
            while (englishMetrics.width > availableWidth && fontSize > 16) {
                fontSize -= 1;
                ctx.font = `bold ${fontSize}px Arial`;
                englishMetrics = ctx.measureText(englishText);
            }
            
            // 绘制中文解释
            const chineseFontSize = Math.min(14, fontSize - 4);
            ctx.font = `${chineseFontSize}px Arial`;
            let chineseText = obstacle.word.cn;
            let chineseMetrics = ctx.measureText(chineseText);
            
            // 计算垂直位置
            const verticalGap = 30;
            const englishY = centerY - verticalGap/2;
            const chineseY = centerY + verticalGap/2;
            
            // 绘制英文单词（水平居中）
            ctx.font = `bold ${fontSize}px Arial`;
            ctx.fillText(englishText, centerX - englishMetrics.width / 2, englishY);
            
            // 绘制中文解释（水平居中）
            ctx.font = `${chineseFontSize}px Arial`;
            if (chineseMetrics.width > availableWidth) {
                const lines = getLines(ctx, chineseText, availableWidth);
                lines.forEach((line, index) => {
                    const lineMetrics = ctx.measureText(line);
                    ctx.fillText(
                        line,
                        centerX - lineMetrics.width / 2,
                        chineseY + index * (chineseFontSize + 5)
                    );
                });
            } else {
                ctx.fillText(
                    chineseText,
                    centerX - chineseMetrics.width / 2,
                    chineseY
                );
            }
        }
    });
}

function calculateCloudBoundary(obstacle) {
    // 如果是生成新障碍物时的调用
    if (!obstacle.x) {
        const centerX = obstacle.width / 2;
        const centerY = obstacle.width / 2;
        let leftMost = centerX - obstacle.width / 2;
        let rightMost = centerX + obstacle.width / 2;

        obstacle.circles.forEach(circle => {
            const circleX = centerX + circle.x;
            const leftEdge = circleX - circle.radius;
            const rightEdge = circleX + circle.radius;
            leftMost = Math.min(leftMost, leftEdge);
            rightMost = Math.max(rightMost, rightEdge);
        });

        return {
            left: leftMost,
            right: rightMost,
            center: (leftMost + rightMost) / 2
        };
    }

    // 如果是绘制时的调用
    const centerX = obstacle.x + obstacle.width / 2;
    let leftMost = centerX - obstacle.width / 2;
    let rightMost = centerX + obstacle.width / 2;

    obstacle.circles.forEach(circle => {
        const circleX = centerX + circle.x;
        const leftEdge = circleX - circle.radius;
        const rightEdge = circleX + circle.radius;
        leftMost = Math.min(leftMost, leftEdge);
        rightMost = Math.max(rightMost, rightEdge);
    });

    return {
        left: leftMost,
        right: rightMost,
        center: (leftMost + rightMost) / 2
    };
}

// 辅助函数：将长文本分割成多行
function getLines(ctx, text, maxWidth) {
    let words = text.split(' ');
    let lines = [];
    let currentLine = words[0];

    for (let i = 1; i < words.length; i++) {
        let word = words[i];
        let width = ctx.measureText(currentLine + " " + word).width;
        if (width < maxWidth) {
            currentLine += " " + word;
        } else {
            lines.push(currentLine);
            currentLine = word;
        }
    }
    lines.push(currentLine);
    return lines;
}

function generateObstacle() {
    const minGap = 200;
    let newObstacle;
    let overlap;

    do {
        overlap = false;
        const width = Math.random() * 150 + 150;
        const height = width * (0.6 + Math.random() * 0.2);
        const y = Math.random() * (canvas.height - height);
        
        const circles = generateCloudCircles(width, height);

        let word = getRandomWord();
        while (recentlyCollidedWords.includes(word) || word === lastCollidedWord) {
            word = getRandomWord();
        }

        // 计算云朵的实际边界和文字位置
        const cloudCenter = {
            x: canvas.width + width / 2,
            y: y + height / 2
        };

        newObstacle = {
            x: canvas.width,
            y: y,
            width: width,
            height: height,
            speed: currentSpeed,
            word: word,
            circles: circles,
            hasSpoken: false,
            // 存储固定的文字位置偏移量
            textOffset: {
                x: width / 2, // 相对于云朵左边缘的偏移量
                y: height / 2, // 相对于云朵顶部的偏移量
                calculated: true
            }
        };

        // 检查是否与现有障碍物重叠
        for (let obstacle of obstacles) {
            if (newObstacle.x < obstacle.x + obstacle.width + minGap &&
                newObstacle.x + newObstacle.width + minGap > obstacle.x &&
                newObstacle.y < obstacle.y + obstacle.height + minGap &&
                newObstacle.y + newObstacle.height + minGap > obstacle.y) {
                overlap = true;
                break;
            }
        }
    } while (overlap);

    obstacles.push(newObstacle);
    appearedWordsCount++;
    updateWordCount();
    updateProgressBar();
}

// 修改 generateCloudCircles 函数以适应不同大小的云朵
function generateCloudCircles(width, height) {
    const numCircles = 8;
    const circles = [];
    const baseRadius = width * 0.25; // 从0.15增加到0.25，增加基础半径
    
    for (let i = 0; i < numCircles; i++) {
        const angle = (i / numCircles) * Math.PI * 2;
        const distance = (0.4 + Math.random() * 0.4) * width / 2;
        const x = Math.cos(angle) * distance;
        const y = Math.sin(angle) * distance * 0.7;
        const radius = (0.25 + Math.random() * 0.35) * baseRadius; // 增加小圆的大小范围
        circles.push({x, y, radius});
    }
    return circles;
}

function generateCoin() {
    const minGap = 10;
    let newCoin;
    let overlap;

    do {
        overlap = false;
        newCoin = {
            x: canvas.width,
            y: Math.random() * (canvas.height - 20),
            width: 20,
            height: 20,
            speed: currentSpeed // 使用 currentSpeed
        };

        // 检查是否与现有障碍物重叠
        for (let obstacle of obstacles) {
            if (newCoin.x < obstacle.x + obstacle.width + minGap &&
                newCoin.x + newCoin.width + minGap > obstacle.x &&
                newCoin.y < obstacle.y + obstacle.height + minGap &&
                newCoin.y + newCoin.height + minGap > obstacle.y) {
                overlap = true;
                break;
            }
        }
    } while (overlap);

    coins.push(newCoin);
    console.log('Coin generated at:', newCoin.x, newCoin.y);
}

function gameOver() {
    gameStarted = false;
    cancelAnimationFrame(gameLoopId);
    alert(`Game Over! Your score: ${Math.floor(score)}, Coins collected: ${coinCount}`);
    document.getElementById('startButton').style.display = 'block';
}

// 添键盘事件监听
document.addEventListener('keydown', e => keys[e.code] = true);
document.addEventListener('keyup', e => keys[e.code] = false);

document.addEventListener('DOMContentLoaded', function() {
    const startButton = document.getElementById('startButton');
    if (startButton) {
        startButton.addEventListener('click', startGame);
        console.log('Start button listener added');
    } else {
        console.error('Start button not found');
    }
});

function drawCoins() {
    coins.forEach(coin => {
        const centerX = coin.x + coin.width / 2;
        const centerY = coin.y + coin.height / 2;
        const radius = coin.width / 2;

        // 绘制金币外圈（深金色边缘）
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.fillStyle = '#FFD700'; // 金色
        ctx.fill();
        ctx.strokeStyle = '#DAA520'; // 深金色边缘
        ctx.lineWidth = 2;
        ctx.stroke();

        // 绘制内圈（添加光泽效果）
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius * 0.8, 0, Math.PI * 2);
        ctx.fillStyle = '#FFDF00'; // 稍亮的金色
        ctx.fill();

        // 绘制 "¥" 符号
        ctx.fillStyle = '#DAA520'; // 深金色文字
        ctx.font = 'bold ' + Math.floor(radius * 1.2) + 'px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('¥', centerX, centerY);

        // 添加高光效果
        ctx.beginPath();
        ctx.arc(centerX - radius * 0.3, centerY - radius * 0.3, radius * 0.2, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.fill();
    });
}

function updateCoinDisplay() {
    document.getElementById('coinCount').textContent = `COIN: ${coinCount}`;
    updateBirdShop(); // 每更新金币显示时也更新商店
}

let synth = window.speechSynthesis;

function speakWord(word) {
    if (synth.speaking) {
        console.error('speechSynthesis.speaking');
        synth.cancel(); // 取消当前的朗读
        setTimeout(() => speakWord(word), 50); // 稍后重试
        return;
    }
    if (word) {
        let utterThis = new SpeechSynthesisUtterance(word);
        utterThis.lang = 'en-US';
        synth.speak(utterThis);
    }
}

function showWordReview(word) {
    gameStarted = false;
    cancelAnimationFrame(gameLoopId);

    const reviewDiv = document.createElement('div');
    reviewDiv.id = 'wordReview';
    reviewDiv.style.position = 'absolute';
    reviewDiv.style.top = '50%';
    reviewDiv.style.left = '50%';
    reviewDiv.style.transform = 'translate(-50%, -50%)';
    reviewDiv.style.backgroundColor = 'rgba(255, 255, 255, 0.9)';
    reviewDiv.style.padding = '20px';
    reviewDiv.style.borderRadius = '10px';
    reviewDiv.style.boxShadow = '0 0 10px rgba(0,0,0,0.5)';
    reviewDiv.style.textAlign = 'center';
    reviewDiv.style.zIndex = '1000';

    reviewDiv.innerHTML = `
        <h2>${word.word}</h2>
        <p>${word.cn}</p>
        <button id="playAudioButton" aria-label="Play Audio">🔊</button>
        <button id="continueButton">Continue</button>
        <p class="space-hint">Press SPACE to continue</p>
    `;

    document.body.appendChild(reviewDiv);

    // 立即朗读单词
    speakWord(word.word);

    // 添加播放音频按钮的件监听器
    document.getElementById('playAudioButton').addEventListener('click', () => speakWord(word.word));

    document.getElementById('continueButton').addEventListener('click', continueGame);

    // 添加空格键事件监听器
    document.addEventListener('keydown', handleSpaceKeyPress);

    // 添加单词到收集列表
    if (!collectedWords.some(w => w.word === word.word)) {
        collectedWords.push(word);
        updateCollectedWordsList();
    }
}

// 新增函数来处理空格键按下事件
function handleSpaceKeyPress(e) {
    if (e.code === 'Space') {
        e.preventDefault(); // 止页面滚动
        document.removeEventListener('keydown', handleSpaceKeyPress);
        continueGame();
    }
}

function continueGame() {
    const reviewDiv = document.getElementById('wordReview');
    if (reviewDiv) {
        document.body.removeChild(reviewDiv);
    }
    
    // 移除空格键事件听器
    document.removeEventListener('keydown', handleSpaceKeyPress);
    
    // 将玩家移动到屏幕中央
    player.y = canvas.height / 2 - player.height / 2;
    player.x = canvas.width / 2 - player.width / 2;

    // 移除有在屏幕上的碍物
    obstacles = obstacles.filter(obstacle => obstacle.x > canvas.width);

    gameStarted = true;
    lastTime = 0;
    gameLoopId = requestAnimationFrame(gameLoop);
}

// 删除这个函数
// function changeBeakDirection() {
//     player.beakDirection *= -1;
// }

function checkCircleCollision(player, circleCenterX, circleCenterY, circleRadius) {
    const dx = player.x + player.width / 2 - circleCenterX;
    const dy = player.y + player.height / 2 - circleCenterY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    return distance <= circleRadius + Math.min(player.width, player.height) / 2;
}

// 修改 updateProgressBar 函数
function updateProgressBar() {
    // 使用 appearedWordsCount 代替 coinCount
    const percentage = (appearedWordsCount % 30) / 30 * 100;
    document.getElementById('progress-bar').style.width = `${percentage}%`;
}

// 修改 checkGameCompletion 数，确保在所有30的倍数处都触发恭喜页面
function checkGameCompletion() {
    // 检查是否刚好达到30的倍数
    if (appearedWordsCount > 0 && appearedWordsCount % 30 === 0) {
        // 确这个数字之前没有被恭喜过
        if (!isShowingCongrats) {
            showCongratulations();
        }
    } else {
        // 如果不是30的倍数，重置标志
        isShowingCongrats = false;
    }
}

// 修改 showCongratulations 函数，显示当前达到的里程碑
function showCongratulations() {
    isShowingCongrats = true;
    gameStarted = false;
    cancelAnimationFrame(gameLoopId);

    const congratsDiv = document.createElement('div');
    congratsDiv.id = 'congratsScreen';

    const milestone = Math.floor(appearedWordsCount / 30) * 30;
    const milestoneNumber = milestone / 30; // 计算第几个30
    
    congratsDiv.innerHTML = `
        <h2 style="color: #FFD700; font-size: 48px; margin-bottom: 20px;">宝宝你真棒</h2>
        <p style="color: #FFFFFF; font-size: 24px; margin-bottom: 30px;">你已经学习了${milestone}个单词</p>
        <p style="color: #FFFFFF; font-size: 18px; margin-bottom: 30px;">这是你的第${milestoneNumber}个30词里程碑</p>
        <button id="continueButton" style="font-size: 20px; padding: 10px 20px; background-color: #4CAF50; color: white; border: none; border-radius: 5px; cursor: pointer;">继续游戏</button>
        <p class="space-hint">按空格键继续</p>
    `;

    document.body.appendChild(congratsDiv);

    // 循环播放音乐
    congratsAudioLoop = setInterval(() => {
        congratsAudio.currentTime = 0;
        congratsAudio.play();
    }, congratsAudio.duration * 1000);

    // 创建彩带
    createConfetti();

    document.getElementById('continueButton').addEventListener('click', () => {
        document.body.removeChild(congratsDiv);
        congratsAudio.pause();
        congratsAudio.currentTime = 0;
        stopConfetti();
        isShowingCongrats = false; // 重置标志
        continueGameAfterCongrats();
    });
    
    // 添加空格键事件监听器
    document.addEventListener('keydown', handleCongratsSpaceKeyPress);
}

function handleCongratsSpaceKeyPress(e) {
    if (e.code === 'Space') {
        e.preventDefault();
        continueCongrats();
    }
}

function continueCongrats() {
    const congratsDiv = document.getElementById('congratsScreen');
    if (congratsDiv) {
        document.body.removeChild(congratsDiv);
    }
    clearInterval(congratsAudioLoop);
    congratsAudio.pause();
    congratsAudio.currentTime = 0;
    stopConfetti();
    document.removeEventListener('keydown', handleCongratsSpaceKeyPress);
    continueGameAfterCongrats();
}

// 添加彩带效果
function createConfetti() {
    const confettiContainer = document.createElement('div');
    confettiContainer.id = 'confettiContainer';
    confettiContainer.style.position = 'fixed';
    confettiContainer.style.top = '0';
    confettiContainer.style.left = '0';
    confettiContainer.style.width = '100%';
    confettiContainer.style.height = '100%';
    confettiContainer.style.pointerEvents = 'none'; // 允许点击穿透
    confettiContainer.style.zIndex = '1001';
    document.body.appendChild(confettiContainer);

    for (let i = 0; i < 150; i++) {
        const confetti = document.createElement('div');
        confetti.className = 'confetti';
        confetti.style.left = Math.random() * 100 + 'vw';
        confetti.style.animationDelay = Math.random() * 3 + 's';
        confetti.style.backgroundColor = getRandomColor();
        confettiContainer.appendChild(confetti);
    }
}

function stopConfetti() {
    const confettiContainer = document.getElementById('confettiContainer');
    if (confettiContainer) {
        document.body.removeChild(confettiContainer);
    }
}

function getRandomColor() {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}

// 修改 continueGameAfterCongrats 函数
function continueGameAfterCongrats() {
    // 不重置金币计数，保持累加
    updateCoinDisplay();
    updateProgressBar();

    // 清除所有障碍物和金币
    obstacles = [];
    coins = [];

    // 重置玩家位置
    player.y = canvas.height / 2 - player.height / 2;

    // 继游戏
    gameStarted = true;
    lastTime = 0;
    gameLoopId = requestAnimationFrame(gameLoop);
    isShowingCongrats = false; // 确保重置标志
}

// 添加新函数来获取随机单词
function getRandomWords(count) {
    let shuffled = ieltsWords.sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
}

function increaseSpeed() {
    if (currentSpeed === initialSpeed) {
        // 只有在第一次增加速度时更新初始速度
        initialSpeed = currentSpeed;
    }
    currentSpeed = Math.min(currentSpeed + speedStep, maxSpeed);
    updateSpeedDisplay();
    updateAllSpeeds();
}

function decreaseSpeed() {
    if (currentSpeed === initialSpeed) {
        // 只有在第一次增加速度时更新初始速度
        initialSpeed = currentSpeed;
    }
    currentSpeed = Math.max(currentSpeed - speedStep, minSpeed);
    updateSpeedDisplay();
    updateAllSpeeds();
}

function updateSpeedDisplay() {
    document.getElementById('speedDisplay').textContent = `Speed: ${currentSpeed}`;
}

// 添加新函数来更新所有对象的速度
function updateAllSpeeds() {
    obstacles.forEach(obstacle => obstacle.speed = currentSpeed);
    coins.forEach(coin => coin.speed = currentSpeed);
}

// 修改键盘事件监器
document.addEventListener('keydown', e => {
    keys[e.code] = true;
    if (e.code === 'ArrowLeft' || e.code === 'ArrowRight') {
        e.preventDefault(); // 防止页面滚动
    }
    if (e.code === 'Space' && gameStarted) {
        e.preventDefault(); // 防止页面滚动
        togglePause();
    }
});
document.addEventListener('keyup', e => {
    keys[e.code] = false;
});

// 添加新的 resetSpeed 函数
function resetSpeed() {
    if (currentSpeed !== initialSpeed) {
        currentSpeed = initialSpeed;
        updateSpeedDisplay();
        updateAllSpeeds();
    }
}

// 在游戏重置或开始新一轮时，清空 collidedObstacles
function resetGame() {
    // ... 其他重置代码 ...
    collidedObstacles = [];
    // ... 其他重置代码 ...
    recentlyCollidedWords = [];
}

// 添加新函数来更新单词列表
function updateCollectedWordsList() {
    const wordList = document.getElementById('collected-words');
    wordList.innerHTML = '';
    collectedWords.forEach((word, index) => {
        const li = document.createElement('li');
        li.innerHTML = `
            <span>${word.word} - ${word.cn}</span>
            <button class="delete-word" data-index="${index}">-</button>
        `;
        li.querySelector('.delete-word').addEventListener('click', function(e) {
            e.stopPropagation(); // 防止事件冒泡
            deleteCollectedWord(index);
        });
        wordList.appendChild(li);
    });
}

function deleteCollectedWord(index) {
    collectedWords.splice(index, 1);
    updateCollectedWordsList();
}

function updateBirdShop() {
    const birdColorsList = document.getElementById('bird-colors');
    birdColorsList.innerHTML = '';
    birdColors.forEach(birdColor => {
        const li = document.createElement('li');

        const canvas = document.createElement('canvas');
        canvas.width = 60;
        canvas.height = 40;
        const ctx = canvas.getContext('2d');
        drawBirdIcon(ctx, birdColor.color);

        const nameSpan = document.createElement('span');
        nameSpan.textContent = birdColor.name;
        nameSpan.className = 'bird-name';

        const priceSpan = document.createElement('span');
        priceSpan.className = 'bird-price';
        if (purchasedBirds.includes(birdColor.color)) {
            priceSpan.textContent = birdColor.color === currentBirdColor ? 'Current' : 'Select';
        } else {
            priceSpan.textContent = birdColor.price + ' coins';
        }

        li.appendChild(canvas);
        li.appendChild(nameSpan);
        li.appendChild(priceSpan);

        if (birdColor.color === currentBirdColor) {
            li.style.border = '2px solid #4a90e2'; // 修改这里，使用与标题相同的蓝色
            li.style.cursor = 'default';
        } else if (!purchasedBirds.includes(birdColor.color) && coinCount < birdColor.price) {
            li.style.position = 'relative';
            const overlay = document.createElement('div');
            overlay.style.position = 'absolute';
            overlay.style.top = '0';
            overlay.style.left = '0';
            overlay.style.width = '100%';
            overlay.style.height = '100%';
            overlay.style.backgroundColor = 'rgba(128, 128, 128, 0.5)';
            li.appendChild(overlay);
            li.style.cursor = 'not-allowed';
        } else {
            li.onclick = () => buyBirdColor(birdColor);
            li.style.cursor = 'pointer';
        }
        birdColorsList.appendChild(li);
    });
}

function drawBirdIcon(ctx, color) {
    ctx.save();
    ctx.translate(30, 20); // 调整中心点
    
    // 绘制身体
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.ellipse(0, 0, 15, 10, 0, 0, Math.PI * 2); // 减小大小
    ctx.fill();
    
    // 绘制翅膀
    ctx.fillStyle = adjustColor(color, -20);
    ctx.beginPath();
    ctx.ellipse(-8, 0, 8, 5, Math.PI / 4, 0, Math.PI * 2); // 减小大小
    ctx.fill();
    
    // 绘制眼睛
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.arc(8, -3, 3, 0, Math.PI * 2); // 减小大小
    ctx.fill();
    ctx.fillStyle = 'black';
    ctx.beginPath();
    ctx.arc(9, -3, 1.5, 0, Math.PI * 2); // 减小大小
    ctx.fill();
    
    // 绘制鸟嘴
    ctx.fillStyle = '#FFA500';
    ctx.beginPath();
    ctx.moveTo(12, 0);
    ctx.lineTo(18, -2);
    ctx.lineTo(18, 2);
    ctx.closePath();
    ctx.fill();
    
    ctx.restore();
}

function buyBirdColor(birdColor) {
    if (!isPaused) {
        alert("Please pause the game before changing the bird color.");
        return;
    }

    if (birdColor.price === 0 || purchasedBirds.includes(birdColor.color)) {
        currentBirdColor = birdColor.color;
        alert(`You've selected the ${birdColor.name} bird!`);
        updateBirdShop();
        drawPlayer();
    } else if (coinCount >= birdColor.price) {
        coinCount -= birdColor.price;
        currentBirdColor = birdColor.color;
        purchasedBirds.push(birdColor.color);
        updateCoinDisplay();
        alert(`You've purchased the ${birdColor.name} bird!`);
        updateBirdShop();
        drawPlayer();
    } else {
        alert(`Not enough coins! You need ${birdColor.price - coinCount} more coins.`);
    }
}

function togglePause() {
    isPaused = !isPaused;
    if (isPaused) {
        cancelAnimationFrame(gameLoopId);
        showPauseScreen();
    } else {
        hidePauseScreen();
        lastTime = performance.now();
        gameLoopId = requestAnimationFrame(gameLoop);
    }
}

// 添加显示暂停屏幕的函数
function showPauseScreen() {
    const pauseScreen = document.createElement('div');
    pauseScreen.id = 'pauseScreen';
    pauseScreen.style.position = 'absolute';
    pauseScreen.style.top = '0';
    pauseScreen.style.left = '0';
    pauseScreen.style.width = '100%';
    pauseScreen.style.height = '100%';
    pauseScreen.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
    pauseScreen.style.display = 'flex';
    pauseScreen.style.justifyContent = 'center';
    pauseScreen.style.alignItems = 'center';
    pauseScreen.style.zIndex = '1000';
    pauseScreen.innerHTML = '<h2 style="color: white;">Game Paused</h2>';
    document.getElementById('game-area').appendChild(pauseScreen);
}

// 添加隐藏暂停屏幕的函数
function hidePauseScreen() {
    const pauseScreen = document.getElementById('pauseScreen');
    if (pauseScreen) {
        pauseScreen.remove();
    }
}

function adjustColor(color, amount) {
    return '#' + color.replace(/^#/, '').replace(/../g, color => ('0'+Math.min(255, Math.max(0, parseInt(color, 16) + amount)).toString(16)).substr(-2));
}

// 在文件末尾添加以下函数
function setupCopyAllWordsButton() {
    const copyButton = document.getElementById('copyAllWords');
    copyButton.addEventListener('click', copyAllWords);
}

function copyAllWords() {
    const wordList = collectedWords.map(word => `${word.word} - ${word.cn}`).join('\n');
    navigator.clipboard.writeText(wordList).then(() => {
        alert('All words copied to clipboard!');
    }).catch(err => {
        console.error('Failed to copy words: ', err);
        alert('Failed to copy words. Please try again.');
    });
}

// 加新函数来更新单词计数
function updateWordCount() {
    document.getElementById('wordCount').textContent = `WORDS: ${appearedWordsCount}`;
}

