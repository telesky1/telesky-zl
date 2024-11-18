
// 预加载功能
const preloadedImages = [];

function preloadImages() {
  const images = ['五色环电阻.png', '四色环电阻.png'];
  images.forEach(src => {
    const img = new Image();
    img.src = src;
    preloadedImages.push(img);
  });
}

window.onload = function () {
  init();
  preloadImages();
  // 添加事件监听器，使按下 Enter 键时计算色环
  document.getElementById('resistance-input').addEventListener('keydown', function (event) {
    if (event.key === 'Enter') {
      calculateBandsFromValue();
    }
  });
};
// 定义颜色与数值的对应关系
const colorCodes = [
  { color: '黑色', value: 0, multiplier: 1, tolerance: null, hex: '#000000' },
  { color: '棕色', value: 1, multiplier: 10, tolerance: 1, hex: '#8B4513' },
  { color: '红色', value: 2, multiplier: 100, tolerance: 2, hex: '#FF0000' },
  { color: '橙色', value: 3, multiplier: 1000, tolerance: null, hex: '#FFA500' },
  { color: '黄色', value: 4, multiplier: 10000, tolerance: null, hex: '#FFFF00' },
  { color: '绿色', value: 5, multiplier: 100000, tolerance: 0.5, hex: '#008000' },
  { color: '蓝色', value: 6, multiplier: 1000000, tolerance: 0.25, hex: '#0000FF' },
  { color: '紫色', value: 7, multiplier: 10000000, tolerance: 0.1, hex: '#800080' },
  { color: '灰色', value: 8, multiplier: 100000000, tolerance: 0.05, hex: '#808080' },
  { color: '白色', value: 9, multiplier: 1000000000, tolerance: null, hex: '#FFFFFF' },
  { color: '金色', value: null, multiplier: 0.1, tolerance: 5, hex: '#FFD700' },
  { color: '银色', value: null, multiplier: 0.01, tolerance: 10, hex: '#C0C0C0' },
  { color: '无色', value: null, multiplier: null, tolerance: 20, hex: '#FFFFFF' }
];

// 倍率色环选项（排除“无色”）
const multiplierColors = colorCodes.filter(c => c.multiplier !== null && c.color !== '无色');

// 初始化色环选择器
function init() {
  updateBands();
}

// 更新色环选择器
function updateBands() {
  const bandCount = parseInt(document.querySelector('input[name="band-count"]:checked').value);
  const colorSelectorsDiv = document.getElementById('color-selectors');
  colorSelectorsDiv.innerHTML = '';

  const labels = bandCount === 4 ? ['色环 1', '色环 2', '倍率', '误差'] :
    ['色环 1', '色环 2', '色环 3', '倍率', '误差'];

  for (let i = 0; i < bandCount; i++) {
    const selectorContainer = document.createElement('div');
    selectorContainer.style.display = 'flex';
    selectorContainer.style.flexDirection = 'row';
    selectorContainer.style.alignItems = 'center';
    selectorContainer.style.marginBottom = '15px';

    const label = document.createElement('label');
    label.innerText = labels[i] + '：';
    label.style.width = '80px'; // 固定标签宽度
    label.style.marginRight = '10px';

    const selectorDiv = document.createElement('div');
    selectorDiv.className = 'color-selector';

    const selectedOption = document.createElement('div');
    selectedOption.className = 'selected-option';
    selectedOption.dataset.bandIndex = i;

    const colorBox = document.createElement('div');
    colorBox.className = 'color-box';
    colorBox.style.backgroundColor = '#fff';

    const colorName = document.createElement('span');
    colorName.innerText = '请选择颜色';

    const arrow = document.createElement('span');
    arrow.innerHTML = '&#9662;';

    selectedOption.appendChild(colorBox);
    selectedOption.appendChild(colorName);
    selectedOption.appendChild(arrow);

    const optionsDiv = document.createElement('div');
    optionsDiv.className = 'options';

    // 根据色环位置过滤可选颜色
    let options = [];
    if ((i === 2 && bandCount === 4) || (i === 3 && bandCount === 5)) {
      // 倍率色环
      options = multiplierColors;
    } else if (i === bandCount - 1) {
      // 误差色环
      options = colorCodes.filter(c => c.tolerance !== null);
    } else {
      // 数字色环
      options = colorCodes.filter(c => c.value !== null);
    }

    options.forEach(color => {
      const optionDiv = document.createElement('div');
      optionDiv.className = 'option';
      optionDiv.dataset.colorName = color.color;
      optionDiv.dataset.bandIndex = i;

      const optionColorBox = document.createElement('div');
      optionColorBox.className = 'color-box';
      optionColorBox.style.backgroundColor = color.hex;

      const optionColorName = document.createElement('span');
      optionColorName.innerText = color.color;

      optionDiv.appendChild(optionColorBox);
      optionDiv.appendChild(optionColorName);

      optionDiv.addEventListener('click', function () {
        selectColor(this.dataset.bandIndex, this.dataset.colorName);
        optionsDiv.style.display = 'none';
      });

      optionsDiv.appendChild(optionDiv);
    });

    selectedOption.addEventListener('click', function () {
      optionsDiv.style.display = optionsDiv.style.display === 'block' ? 'none' : 'block';
    });

    selectorDiv.appendChild(selectedOption);
    selectorDiv.appendChild(optionsDiv);

    selectorContainer.appendChild(label);
    selectorContainer.appendChild(selectorDiv);

    colorSelectorsDiv.appendChild(selectorContainer);
  }

  // 更新电阻图片
  updateResistorImage();

  // 绑定事件
  calculateFromColors();
}

// 更新电阻图片
function updateResistorImage() {
  const resistorImageContainer = document.getElementById('resistor-image-container');
  const bandCount = parseInt(document.querySelector('input[name="band-count"]:checked').value);

  // 清空容器
  resistorImageContainer.innerHTML = '';

  // 首先，添加色环覆盖层
  for (let i = 0; i < bandCount; i++) {
    const bandOverlay = document.createElement('div');
    bandOverlay.className = 'band-overlay';
    bandOverlay.id = `band-overlay-${i}`;

    // 根据色环位置设置样式
    const positions = bandCount === 4
      ? [
        { left: '10%', width: '10%' }, // 色环1
        { left: '25%', width: '10%' }, // 色环2
        { left: '45%', width: '10%' }, // 倍率色环
        { left: '80%', width: '10%' }  // 误差色环
      ]
      : [
        { left: '10%', width: '10%' }, // 色环1
        { left: '25%', width: '10%' }, // 色环2
        { left: '35%', width: '10%' }, // 色环3
        { left: '45%', width: '10%' }, // 倍率色环
        { left: '80%', width: '10%' }  // 误差色环
      ];

    bandOverlay.style.left = positions[i].left;
    bandOverlay.style.width = positions[i].width;
    bandOverlay.style.height = '98%';
    bandOverlay.style.top = '1%';
    bandOverlay.style.position = 'absolute';

    // 设置色环覆盖层的层叠顺序
    bandOverlay.style.zIndex = '1';

    resistorImageContainer.appendChild(bandOverlay);
  }

  // 然后，添加电阻图片
  const imgElement = document.createElement('img');
  imgElement.alt = '电阻图片';
  imgElement.style.width = '100%';
  imgElement.style.height = 'auto';
  imgElement.style.display = 'block';

  // 设置电阻图片的定位方式和层叠顺序
  imgElement.style.position = 'relative';
  imgElement.style.zIndex = '2';

  // 设置图片源
  imgElement.src = bandCount === 4
    ? '四色环电阻.png' // <-- 四色环电阻图片链接
    : '五色环电阻.png'; // <-- 五色环电阻图片链接

  resistorImageContainer.appendChild(imgElement);
}

// 选择颜色
function selectColor(bandIndex, colorName) {
  const bandSelectors = document.querySelectorAll('.color-selector');
  const selectedOption = bandSelectors[bandIndex].querySelector('.selected-option');
  const colorObj = colorCodes.find(c => c.color === colorName);

  selectedOption.querySelector('.color-box').style.backgroundColor = colorObj.hex;
  selectedOption.querySelector('span').innerText = colorName;

  selectedOption.dataset.selectedColor = colorName;

  // 更新电阻图片中的色环颜色
  const bandOverlay = document.getElementById(`band-overlay-${bandIndex}`);
  if (bandOverlay) {
    bandOverlay.style.backgroundColor = colorObj.hex;
  }

  calculateFromColors();
}

// 从色环计算阻值
function calculateFromColors() {
  const bandSelectors = document.querySelectorAll('.color-selector');
  const bandCount = bandSelectors.length;

  let digits = '';
  let multiplier = 1;
  let tolerance = '';

  for (let i = 0; i < bandCount; i++) {
    const selectedColorName = bandSelectors[i].querySelector('.selected-option').dataset.selectedColor;
    if (!selectedColorName) {
      document.getElementById('result-display').innerText = '请完整选择所有色环颜色';
      return;
    }

    const colorObj = colorCodes.find(c => c.color === selectedColorName);

    if ((i === 2 && bandCount === 4) || (i === 3 && bandCount === 5)) {
      multiplier = colorObj.multiplier;
    } else if (i === bandCount - 1) {
      tolerance = colorObj.tolerance;
    } else {
      digits += colorObj.value.toString();
    }
  }

  let resistanceValue = parseInt(digits) * multiplier;

  // 阻值换算
  let unit = 'Ω';
  if (resistanceValue >= 1e9) {
    resistanceValue = resistanceValue / 1e9;
    unit = 'GΩ';
  } else if (resistanceValue >= 1e6) {
    resistanceValue = resistanceValue / 1e6;
    unit = 'MΩ';
  } else if (resistanceValue >= 1e3) {
    resistanceValue = resistanceValue / 1e3;
    unit = 'kΩ';
  }

  resistanceValue = resistanceValue.toFixed(2);
  document.getElementById('result-display').innerText = `${resistanceValue} ${unit}   ±${tolerance}%`;
}

// 重置选择
function resetSelections() {
  const bandSelectors = document.querySelectorAll('.color-selector');
  bandSelectors.forEach(selector => {
    const selectedOption = selector.querySelector('.selected-option');
    selectedOption.querySelector('.color-box').style.backgroundColor = '#fff';
    selectedOption.querySelector('span').innerText = '请选择颜色';
    delete selectedOption.dataset.selectedColor;
  });
  document.getElementById('result-display').innerText = '';

  // 重置电阻图片中的色环颜色
  const bandOverlays = document.querySelectorAll('.band-overlay');
  bandOverlays.forEach(band => {
    band.style.backgroundColor = 'transparent';
  });
}

// 从阻值计算色环
function calculateBandsFromValue() {
  const resistanceInput = document.getElementById('resistance-input').value;
  const unitMultiplier = parseFloat(document.getElementById('unit-select').value);

  if (!resistanceInput || resistanceInput <= 0) {
    document.getElementById('bands-result').innerText = '请输入有效的阻值。';
    return;
  }

  const bandCount = parseInt(document.querySelector('input[name="band-count"]:checked').value);
  let resistanceValue = resistanceInput * unitMultiplier;
  const significantFigures = bandCount === 4 ? 2 : 3;

  let digitsArray = [];
  let multiplierValue;

  if (resistanceValue < 1) {
    // 当阻值小于1欧姆时，倍率固定为银色（×0.01）
    multiplierValue = 0.01;
    const scaledValue = resistanceValue / multiplierValue;
    let digits = Math.round(scaledValue);
    digitsArray = digits.toString().split('').map(Number);

    // 确保数字数组有足够的有效位数，不足时在前面补零
    while (digitsArray.length < significantFigures) {
      digitsArray.unshift(0);
    }
  } else {
    // 原有逻辑处理阻值大于等于1欧姆的情况
    const resistanceStr = resistanceValue.toExponential();
    const [mantissaStr, exponentStr] = resistanceStr.split('e');
    let mantissa = parseFloat(mantissaStr);
    let exponent = parseInt(exponentStr);

    mantissa = mantissa * Math.pow(10, significantFigures - 1);
    let digits = Math.round(mantissa);
    exponent = exponent - (significantFigures - 1);

    digitsArray = digits.toString().split('').map(Number);

    if (digitsArray.length > significantFigures) {
      digitsArray = digitsArray.slice(0, significantFigures);
      exponent += digitsArray.length - significantFigures;
    } else if (digitsArray.length < significantFigures) {
      while (digitsArray.length < significantFigures) {
        digitsArray.push(0);
      }
    }

    multiplierValue = Math.pow(10, exponent);
  }

  // 获取色环颜色
  let bandColors = [];
  for (let i = 0; i < significantFigures; i++) {
    const digit = digitsArray[i];
    const colorObj = colorCodes.find(c => c.value === digit);
    if (colorObj) {
      bandColors.push(colorObj.color);
    } else {
      document.getElementById('bands-result').innerText = '无法计算对应的色环。';
      return;
    }
  }

  // 查找倍率色环对应的颜色
  const multiplierObj = colorCodes.find(c => c.multiplier === multiplierValue);
  if (multiplierObj) {
    bandColors.push(multiplierObj.color);
  } else {
    document.getElementById('bands-result').innerText = '无法计算对应的色环。';
    return;
  }

  // 设置误差色环：四色环为金色，五色环为棕色
  const toleranceColor = bandCount === 4 ? '金色' : '棕色';
  bandColors.push(toleranceColor);

  document.getElementById('bands-result').innerText = `对应的色环颜色：${bandColors.join('、')}`;

  // 更新色环选择器并显示结果
  updateBands();
  const bandSelectors = document.querySelectorAll('.color-selector');
  for (let i = 0; i < bandColors.length; i++) {
    const colorName = bandColors[i];
    selectColor(i, colorName);
  }
}



// 点击页面其他地方关闭下拉菜单
document.addEventListener('click', function (e) {
  const colorSelectors = document.querySelectorAll('.color-selector');
  colorSelectors.forEach(selector => {
    if (!selector.contains(e.target)) {
      selector.querySelector('.options').style.display = 'none';
    }
  });
});

// 初始化
init();