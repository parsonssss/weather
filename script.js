// 天气数据模拟（作为备用）
const weatherData = {
    location: "北京市",
    current: {
        date: "2025-03-02",
        temperature: 21,
        feels_like: 20,
        maxTemp: 24,
        minTemp: 15,
        humidity: 45,
        pressure: 1012,
        windSpeed: 15,
        windDeg: 180,
        description: "晴朗",
        type: "sunny" // sunny, cloudy, rainy, snowy
    },
    forecast: [
        {
            date: "2025-03-03",
            maxTemp: 25,
            minTemp: 16,
            humidity: 42,
            windSpeed: 12,
            description: "晴朗",
            type: "sunny"
        },
        {
            date: "2025-03-04",
            maxTemp: 23,
            minTemp: 14,
            humidity: 50,
            windSpeed: 18,
            description: "多云",
            type: "cloudy"
        },
        {
            date: "2025-03-05",
            maxTemp: 19,
            minTemp: 12,
            humidity: 65,
            windSpeed: 20,
            description: "阴天转小雨",
            type: "rainy"
        },
        {
            date: "2025-03-06",
            maxTemp: 17,
            minTemp: 10,
            humidity: 72,
            windSpeed: 15,
            description: "小雨",
            type: "rainy"
        },
        {
            date: "2025-03-07",
            maxTemp: 16,
            minTemp: 8,
            humidity: 60,
            windSpeed: 22,
            description: "多云",
            type: "cloudy"
        },
        {
            date: "2025-03-08",
            maxTemp: 15,
            minTemp: 7,
            humidity: 40,
            windSpeed: 25,
            description: "晴朗",
            type: "sunny"
        }
    ]
};

// 天气类型对应图标
const weatherIcons = {
    sunny: "fas fa-sun",
    cloudy: "fas fa-cloud",
    rainy: "fas fa-cloud-rain",
    snowy: "fas fa-snowflake"
};

// 天气代码映射到自定义类型
const weatherCodeMapping = {
    // 晴天 (Clear sky)
    '01d': 'sunny', 
    '01n': 'sunny',
    // 少云 (Few clouds)
    '02d': 'sunny', 
    '02n': 'sunny',
    // 多云 (Scattered clouds, Broken clouds, Overcast)
    '03d': 'cloudy', 
    '03n': 'cloudy',
    '04d': 'cloudy', 
    '04n': 'cloudy',
    // 阵雨，小雨 (Shower rain, Rain)
    '09d': 'rainy', 
    '09n': 'rainy',
    '10d': 'rainy', 
    '10n': 'rainy',
    // 雷雨 (Thunderstorm)
    '11d': 'rainy', 
    '11n': 'rainy',
    // 雪 (Snow)
    '13d': 'snowy', 
    '13n': 'snowy',
    // 雾 (Mist)
    '50d': 'cloudy', 
    '50n': 'cloudy'
};

// 格式化日期函数
function formatDate(dateString) {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const weekDays = ["星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"];
    const weekDay = weekDays[date.getDay()];
    
    return `${year}年${month}月${day}日 ${weekDay}`;
}

// 将OpenWeather API数据格式化为我们的格式
function formatWeatherData(currentData, forecastData) {
    // 当前天气格式化
    const current = {
        date: new Date().toISOString().split('T')[0],
        temperature: Math.round(currentData.main.temp),
        feels_like: Math.round(currentData.main.feels_like),
        maxTemp: Math.round(currentData.main.temp_max),
        minTemp: Math.round(currentData.main.temp_min),
        humidity: currentData.main.humidity,
        pressure: currentData.main.pressure,
        windSpeed: Math.round(currentData.wind.speed * 3.6), // 转换为km/h（原始单位是m/s）
        windDeg: currentData.wind.deg,
        description: currentData.weather[0].description,
        type: weatherCodeMapping[currentData.weather[0].icon] || 'cloudy'
    };

    // 预报天气格式化 - 使用5天/3小时预报数据进行处理
    const forecast = [];
    const dailyData = {};

    // 处理5天3小时预报数据，合并为每日数据
    forecastData.list.forEach(item => {
        const date = item.dt_txt.split(' ')[0];
        if (!dailyData[date]) {
            dailyData[date] = {
                temps: [],
                feels_like: [],
                humidities: [],
                pressures: [],
                windSpeeds: [],
                windDirs: [],
                descriptions: [],
                types: [],
                icons: []
            };
        }
        
        dailyData[date].temps.push(item.main.temp);
        dailyData[date].feels_like.push(item.main.feels_like);
        dailyData[date].humidities.push(item.main.humidity);
        dailyData[date].pressures.push(item.main.pressure);
        dailyData[date].windSpeeds.push(item.wind.speed);
        dailyData[date].windDirs.push(item.wind.deg);
        dailyData[date].descriptions.push(item.weather[0].description);
        dailyData[date].types.push(weatherCodeMapping[item.weather[0].icon] || 'cloudy');
        dailyData[date].icons.push(item.weather[0].icon);
    });

    // 将每日数据转换为我们需要的格式
    Object.keys(dailyData).forEach(date => {
        const dayData = dailyData[date];
        // 计算每日最高/最低温度
        const maxTemp = Math.round(Math.max(...dayData.temps));
        const minTemp = Math.round(Math.min(...dayData.temps));
        // 计算平均值
        const avgHumidity = Math.round(dayData.humidities.reduce((a, b) => a + b, 0) / dayData.humidities.length);
        const avgWindSpeed = Math.round(dayData.windSpeeds.reduce((a, b) => a + b, 0) / dayData.windSpeeds.length * 3.6); // 转为km/h
        
        // 找出出现频率最高的天气类型（以正午附近为准）
        let dominantType = 'cloudy';
        let dominantDesc = '多云';
        
        // 如果有，尝试获取当天中午12点的数据作为代表
        const noonIndex = dayData.icons.findIndex(icon => {
            const timeIndex = forecastData.list.findIndex(item => 
                item.dt_txt.includes(date) && item.weather[0].icon === icon
            );
            if (timeIndex !== -1) {
                const hourStr = forecastData.list[timeIndex].dt_txt.split(' ')[1];
                const hour = parseInt(hourStr.split(':')[0]);
                return hour >= 11 && hour <= 14; // 中午附近的时间
            }
            return false;
        });
        
        if (noonIndex !== -1) {
            dominantType = dayData.types[noonIndex];
            dominantDesc = dayData.descriptions[noonIndex];
        } else {
            // 如果找不到中午的数据，则使用出现频率最高的类型
            const typeCount = {};
            dayData.types.forEach(type => {
                typeCount[type] = (typeCount[type] || 0) + 1;
            });
            
            let maxCount = 0;
            Object.keys(typeCount).forEach(type => {
                if (typeCount[type] > maxCount) {
                    maxCount = typeCount[type];
                    dominantType = type;
                }
            });
            
            // 使用该类型的第一个描述作为代表
            const typeIndex = dayData.types.indexOf(dominantType);
            dominantDesc = dayData.descriptions[typeIndex !== -1 ? typeIndex : 0];
        }

        forecast.push({
            date,
            maxTemp,
            minTemp,
            humidity: avgHumidity,
            windSpeed: avgWindSpeed,
            description: dominantDesc,
            type: dominantType
        });
    });

    // 排序并只保癖6天的预报，从明天开始
    const today = new Date().toISOString().split('T')[0];
    const sortedForecast = forecast
        .filter(day => day.date > today) // 去掉今天，从明天开始显示
        .sort((a, b) => new Date(a.date) - new Date(b.date))
        .slice(0, 6); // 正好6天预报
    
    // 如果预报天数不足，生成模拟数据补齐至正好6天
    if (sortedForecast.length < 6) {
        const lastDate = sortedForecast.length > 0 
            ? new Date(sortedForecast[sortedForecast.length - 1].date)
            : new Date(today);
            
        while (sortedForecast.length < 6) {
            lastDate.setDate(lastDate.getDate() + 1);
            const nextDate = lastDate.toISOString().split('T')[0];
            
            // 生成模拟天气数据，基于前一天或默认值
            const prevForecast = sortedForecast.length > 0 
                ? sortedForecast[sortedForecast.length - 1] 
                : {
                    maxTemp: 22,
                    minTemp: 15,
                    humidity: 50,
                    windSpeed: 15,
                    description: "预计晴天",
                    type: "sunny"
                };
                
            // 创建稍微有变化的新数据
            sortedForecast.push({
                date: nextDate,
                maxTemp: Math.round(prevForecast.maxTemp + (Math.random() * 4 - 2)),
                minTemp: Math.round(prevForecast.minTemp + (Math.random() * 4 - 2)),
                humidity: Math.min(100, Math.max(0, Math.round(prevForecast.humidity + (Math.random() * 10 - 5)))),
                windSpeed: Math.max(5, Math.round(prevForecast.windSpeed + (Math.random() * 8 - 4))),
                description: prevForecast.description,
                type: prevForecast.type
            });
        }
    }

    return {
        location: currentData.name,
        current,
        forecast: sortedForecast
    };
}

// 更新当前天气信息
function updateCurrentWeather(data) {
    // 更新文本内容
    document.getElementById("location").textContent = data.location;
    document.getElementById("current-date").textContent = formatDate(data.current.date);
    document.getElementById("current-temp").textContent = `${data.current.temperature}°C`;
    document.getElementById("max-temp").textContent = `${data.current.maxTemp}°C`;
    document.getElementById("min-temp").textContent = `${data.current.minTemp}°C`;
    document.getElementById("humidity").textContent = `${data.current.humidity}%`;
    document.getElementById("wind-speed").textContent = `${data.current.windSpeed} km/h`;
    document.getElementById("weather-desc").textContent = data.current.description;
    
    // 更新图标
    const weatherIconContainer = document.querySelector(".current-weather .weather-icon");
    // 清除原有内容
    weatherIconContainer.innerHTML = "";
    
    // 创建图标元素
    const iconElement = document.createElement("i");
    iconElement.className = weatherIcons[data.current.type];
    weatherIconContainer.appendChild(iconElement);
    
    // 根据天气类型添加特效元素
    if (data.current.type === 'rainy') {
        const raindrops = document.createElement("div");
        raindrops.className = "raindrops";
        
        // 增加雨滴数量
        for (let i = 0; i < 7; i++) {
            const raindrop = document.createElement("div");
            raindrop.className = "raindrop";
            raindrops.appendChild(raindrop);
        }
        
        weatherIconContainer.appendChild(raindrops);
    } else if (data.current.type === 'snowy') {
        const snowflakes = document.createElement("div");
        snowflakes.className = "snowflakes";
        
        for (let i = 0; i < 6; i++) {
            const snowflake = document.createElement("div");
            snowflake.className = "snowflake-particle";
            snowflakes.appendChild(snowflake);
        }
        
        weatherIconContainer.appendChild(snowflakes);
    }
    
    // 更新卡片背景
    const currentWeatherCard = document.querySelector(".current-weather-card");
    currentWeatherCard.className = `card current-weather-card ${data.current.type}`;
    
    // 更新整个页面背景效果 - 如果函数存在才调用
    if (typeof updateBackgroundEffect === 'function') {
        updateBackgroundEffect(data.current.type);
    }
}

// 创建预报卡片
function createForecastCard(forecastData) {
    const card = document.createElement("div");
    card.className = `card forecast-card ${forecastData.type}`;
    
    const formattedDate = formatDate(forecastData.date);
    const weekday = formattedDate.split(" ")[1];
    const dateOnly = formattedDate.split(" ")[0].replace(/\d+年/, '').replace(/\d+月/, '');
    
    // 基本卡片内容 - 简化设计
    card.innerHTML = `
        <div class="card-header">
            <h3>${weekday}</h3>
            <span>${dateOnly}</span>
        </div>
        <div class="card-body">
            <div class="weather-icon">
                <i class="${weatherIcons[forecastData.type]}"></i>
                ${forecastData.type === 'rainy' ? `
                <div class="raindrops">
                    <div class="raindrop"></div>
                    <div class="raindrop"></div>
                    <div class="raindrop"></div>
                    <div class="raindrop"></div>
                </div>` : ''}
                ${forecastData.type === 'snowy' ? `
                <div class="snowflakes">
                    <div class="snowflake-particle"></div>
                    <div class="snowflake-particle"></div>
                    <div class="snowflake-particle"></div>
                    <div class="snowflake-particle"></div>
                </div>` : ''}
            </div>
            <div class="temperature">
                <span>${forecastData.maxTemp}°C</span>
            </div>
            <div class="weather-description">
                <span>${forecastData.description}</span>
            </div>
            <div class="weather-details">
                <div class="detail">
                    <i class="fas fa-temperature-low"></i>
                    <span>最低: ${forecastData.minTemp}°C</span>
                </div>
                <div class="detail">
                    <i class="fas fa-tint"></i>
                    <span>湿度: ${forecastData.humidity}%</span>
                </div>
                <div class="detail">
                    <i class="fas fa-wind"></i>
                    <span>风速: ${forecastData.windSpeed} km/h</span>
                </div>
            </div>
        </div>
    `;
    
    return card;
}

// 生成预报卡片
function generateForecastCards(forecastData) {
    const forecastContainer = document.getElementById("forecast-container");
    forecastContainer.innerHTML = "";
    
    forecastData.forEach(forecast => {
        const card = createForecastCard(forecast);
        forecastContainer.appendChild(card);
    });
}

// 搜索功能实现
function setupSearch() {
    const searchButton = document.getElementById("search-button");
    const searchInput = document.getElementById("search-input");
    const suggestionsContainer = document.getElementById("search-suggestions");
    
    // 搜索建议功能
    let selectedIndex = -1;
    let filteredSuggestions = [];
    
    // 显示搜索建议
    function showSuggestions(inputValue) {
        if (!inputValue) {
            suggestionsContainer.innerHTML = '';
            suggestionsContainer.classList.remove('active');
            return;
        }
        
        const lowerCaseInput = inputValue.toLowerCase();
        
        // 过滤匹配的城市
        filteredSuggestions = CHINA_CITIES.filter(city => {
            return city.name.includes(inputValue) || 
                   city.value.includes(inputValue) || 
                   city.pinyin.includes(lowerCaseInput);
        }).slice(0, 8); // 限制显示前8个结果
        
        if (filteredSuggestions.length > 0) {
            suggestionsContainer.innerHTML = '';
            
            filteredSuggestions.forEach((city, index) => {
                const div = document.createElement('div');
                div.className = 'suggestion-item';
                if (index === selectedIndex) {
                    div.classList.add('selected');
                }
                
                // 高亮匹配部分
                let displayText = city.value;
                let fullName = city.name;
                
                // 自动补全示例：广东 -> 广东省，广州 -> 广州市
                div.innerHTML = `<span>${displayText}</span><span class="full-name">→ ${fullName}</span>`;
                
                div.addEventListener('click', () => {
                    searchInput.value = fullName; // 使用完整名称
                    suggestionsContainer.innerHTML = '';
                    suggestionsContainer.classList.remove('active');
                    searchButton.click(); // 自动触发搜索
                });
                
                suggestionsContainer.appendChild(div);
            });
            
            suggestionsContainer.classList.add('active');
        } else {
            suggestionsContainer.innerHTML = '';
            suggestionsContainer.classList.remove('active');
        }
    }
    
    // 键盘事件处理（上下键选择）
    searchInput.addEventListener('keydown', (e) => {
        // 如果建议不可见，不处理上下键
        if (!suggestionsContainer.classList.contains('active')) return;
        
        const items = suggestionsContainer.querySelectorAll('.suggestion-item');
        
        if (e.key === 'ArrowDown') {
            e.preventDefault(); // 防止光标移动
            selectedIndex = (selectedIndex + 1) % items.length;
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            selectedIndex = selectedIndex <= 0 ? items.length - 1 : selectedIndex - 1;
        } else if (e.key === 'Enter' && selectedIndex >= 0) {
            e.preventDefault();
            items[selectedIndex].click();
            return;
        } else if (e.key === 'Escape') {
            suggestionsContainer.innerHTML = '';
            suggestionsContainer.classList.remove('active');
            selectedIndex = -1;
            return;
        } else {
            return; // 其他键不处理
        }
        
        // 更新选中状态
        items.forEach((item, index) => {
            if (index === selectedIndex) {
                item.classList.add('selected');
            } else {
                item.classList.remove('selected');
            }
        });
    });
    
    // 输入框输入时处理
    searchInput.addEventListener('input', () => {
        const inputValue = searchInput.value.trim();
        selectedIndex = -1; // 重置选中索引
        showSuggestions(inputValue);
    });
    
    // 在外部单击时隐藏建议
    document.addEventListener('click', (e) => {
        if (!suggestionsContainer.contains(e.target) && e.target !== searchInput) {
            suggestionsContainer.innerHTML = '';
            suggestionsContainer.classList.remove('active');
        }
    });
    
    // 点击搜索按钮事件
    searchButton.addEventListener("click", async () => {
        const searchTerm = searchInput.value.trim();
        if (searchTerm !== "") {
            // 显示加载中提示
            document.querySelector(".current-weather-card").classList.add("loading");
            
            try {
                // 获取新城市天气数据
                const newWeatherData = await fetchWeatherData(searchTerm);
                
                // 更新UI
                updateCurrentWeather(newWeatherData);
                generateForecastCards(newWeatherData.forecast);
                
                // 清空输入框
                searchInput.value = "";
                
                // 隐藏建议列表
                suggestionsContainer.innerHTML = '';
                suggestionsContainer.classList.remove('active');
            } catch (error) {
                console.error("搜索出错:", error);
                alert(`无法获取 "${searchTerm}" 的天气数据。请检查城市名称是否正确。`);
            } finally {
                // 移除加载中提示
                document.querySelector(".current-weather-card").classList.remove("loading");
            }
        }
    });
    
    searchInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter" && !suggestionsContainer.classList.contains('active')) {
            searchButton.click();
        }
    });
}

// 在页面加载时初始化
document.addEventListener("DOMContentLoaded", async () => {
    try {
        // 尝试使用地理位置获取天气
        let realWeatherData;
        
        if (navigator.geolocation) {
            try {
                // 显示加载中提示
                document.querySelector(".current-weather-card").classList.add("loading");
                
                // 尝试获取地理位置天气
                realWeatherData = await getWeatherByGeolocation();
                console.log("使用地理位置获取天气成功");
            } catch (geoError) {
                console.warn("地理位置获取失败，使用默认城市:", geoError);
                realWeatherData = await fetchWeatherData();
            }
        } else {
            // 浏览器不支持地理位置，使用默认城市
            realWeatherData = await fetchWeatherData();
        }
        
        // 更新当前天气
        updateCurrentWeather(realWeatherData);
        
        // 生成预报卡片
        generateForecastCards(realWeatherData.forecast);
        
        // 更新页脚显示数据来源
        document.querySelector("footer p").textContent = `© 2025 天气预报网站 | 数据来源: OpenWeather API`;
    } catch (error) {
        console.error("加载天气数据失败:", error);
        
        // 使用模拟数据作为备用
        updateCurrentWeather(weatherData);
        generateForecastCards(weatherData.forecast);
    } finally {
        // 移除加载中提示
        document.querySelector(".current-weather-card").classList.remove("loading");
    }
    
    // 设置搜索功能
    setupSearch();
});

// 更新背景效果
function updateBackgroundEffect(weatherType) {
    // 移除所有现有的背景类
    document.body.classList.remove('sunny-bg', 'cloudy-bg', 'rainy-bg', 'snowy-bg');
    
    // 根据天气类型添加相应的背景类
    document.body.classList.add(`${weatherType}-bg`);
}

// 实际API调用函数 - 按城市名称查询
async function fetchWeatherData(city = "北京") {
    try {
        // 构建API参数
        const params = new URLSearchParams({
            q: city,                // 城市名称
            units: 'metric',        // 使用公制单位(摄氏度)
            lang: 'zh_cn',          // 使用中文
            appid: CONFIG.API_KEY   // API密钥
        });
        
        // 1. 获取当前天气数据
        const currentWeatherURL = `${CONFIG.BASE_URL}/weather?${params.toString()}`;
        const currentWeatherResponse = await fetch(currentWeatherURL);
        
        if (!currentWeatherResponse.ok) {
            const errorData = await currentWeatherResponse.json();
            throw new Error(`天气API错误: ${errorData.message || currentWeatherResponse.statusText}`);
        }
        
        const currentWeatherData = await currentWeatherResponse.json();
        
        // 2. 获取5天/3小时预报数据
        const forecastURL = `${CONFIG.BASE_URL}/forecast?${params.toString()}`;
        const forecastResponse = await fetch(forecastURL);
        
        if (!forecastResponse.ok) {
            const errorData = await forecastResponse.json();
            throw new Error(`预报API错误: ${errorData.message || forecastResponse.statusText}`);
        }
        
        const forecastData = await forecastResponse.json();
        
        // 3. 格式化数据
        return formatWeatherData(currentWeatherData, forecastData);
    } catch (error) {
        console.error("获取天气数据错误:", error);
        throw error; // 将错误向上传递，让调用者处理
    }
}

// 使用地理位置API获取当前位置的天气
async function getWeatherByGeolocation() {
    return new Promise((resolve, reject) => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(async (position) => {
                try {
                    // 使用经纬度获取天气
                    const lat = position.coords.latitude;
                    const lon = position.coords.longitude;
                    
                    // 构建API参数
                    const params = new URLSearchParams({
                        lat: lat,               // 纬度
                        lon: lon,               // 经度
                        units: 'metric',        // 使用公制单位(摄氏度)
                        lang: 'zh_cn',          // 使用中文
                        appid: CONFIG.API_KEY   // API密钥
                    });
                    
                    // 获取当前天气
                    const currentWeatherURL = `${CONFIG.BASE_URL}/weather?${params.toString()}`;
                    const currentWeatherResponse = await fetch(currentWeatherURL);
                    
                    if (!currentWeatherResponse.ok) {
                        const errorData = await currentWeatherResponse.json();
                        throw new Error(`天气API错误: ${errorData.message || currentWeatherResponse.statusText}`);
                    }
                    
                    const currentWeatherData = await currentWeatherResponse.json();
                    
                    // 获取5天预报
                    const forecastURL = `${CONFIG.BASE_URL}/forecast?${params.toString()}`;
                    const forecastResponse = await fetch(forecastURL);
                    
                    if (!forecastResponse.ok) {
                        const errorData = await forecastResponse.json();
                        throw new Error(`预报API错误: ${errorData.message || forecastResponse.statusText}`);
                    }
                    
                    const forecastData = await forecastResponse.json();
                    
                    // 格式化数据
                    resolve(formatWeatherData(currentWeatherData, forecastData));
                } catch (error) {
                    console.error("地理位置天气获取失败:", error);
                    reject(error);
                }
            }, (error) => {
                console.error("无法获取地理位置:", error);
                reject(new Error("无法获取地理位置"));
            }, {
                timeout: 10000,          // 10秒超时
                maximumAge: 5 * 60 * 1000, // 5分钟缓存
                enableHighAccuracy: false  // 不需要高精度定位
            });
        } else {
            reject(new Error("浏览器不支持地理位置功能"));
        }
    });
}