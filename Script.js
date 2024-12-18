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
  // 按下 Enter 键时计算色环
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

// 功率-尺寸对照表
const powerTable = [
  { power: '1/4w', diameter: 2.2, length: 6 },
  { power: '1/2w', diameter: 3.0, length: 9 },
  { power: '1w', diameter: 4.2, length: 11 },
  { power: '2w', diameter: 4.6, length: 15 },
  { power: '3w', diameter: 5.6, length: 17 },
  { power: '5w', diameter: 7.6, length: 24 }
];

const diameterInput = document.getElementById('diameter-input');
const lengthInput = document.getElementById('length-input');
const powerResultDiv = document.getElementById('power-result');

function init() {
  updateBands();
}

function updateBands() {
  const bandCount = document.querySelector('input[name="band-count"]:checked').value;
  const colorSelectorsDiv = document.getElementById('color-selectors');
  const resistorImageContainer = document.getElementById('resistor-image-container');
  const resultDisplay = document.getElementById('result-display');
  const powerContainer = document.getElementById('power-container');
  const powerImageSegments = document.getElementById('power-image-segments');

  if (bandCount === 'power') {
    // 功率计算模式下
    colorSelectorsDiv.style.display = 'none';
    resistorImageContainer.style.display = 'none';
    resultDisplay.style.display = 'none';
    powerContainer.style.display = 'block';
    powerImageSegments.style.display = 'flex'; // 显示功率图片分区
  } else {
    // 四色环/五色环模式下
    powerContainer.style.display = 'none';
    colorSelectorsDiv.style.display = 'block';
    resistorImageContainer.style.display = 'block';
    resultDisplay.style.display = 'block';
    powerImageSegments.style.display = 'none'; // 隐藏功率图片分区

    const bandCountNum = parseInt(bandCount);
    const labels = bandCountNum === 4 ? ['色环 1', '色环 2', '倍率', '误差'] :
      ['色环 1', '色环 2', '色环 3', '倍率', '误差'];

    colorSelectorsDiv.innerHTML = '';

    for (let i = 0; i < bandCountNum; i++) {
      const selectorContainer = document.createElement('div');
      selectorContainer.style.display = 'flex';
      selectorContainer.style.flexDirection = 'row';
      selectorContainer.style.alignItems = 'center';
      selectorContainer.style.marginBottom = '15px';

      const label = document.createElement('label');
      label.innerText = labels[i] + '：';
      label.style.width = '80px';
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

      let options = [];
      if ((i === 2 && bandCountNum === 4) || (i === 3 && bandCountNum === 5)) {
        // 倍率色环
        options = multiplierColors;
      } else if (i === bandCountNum - 1) {
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

    updateResistorImage();
    calculateFromColors();
  }
}

function updateResistorImage() {
  const resistorImageContainer = document.getElementById('resistor-image-container');
  const bandCount = document.querySelector('input[name="band-count"]:checked').value;
  resistorImageContainer.innerHTML = '';

  if (bandCount === '4' || bandCount === '5') {
    const bandCountNum = parseInt(bandCount);
    for (let i = 0; i < bandCountNum; i++) {
      const bandOverlay = document.createElement('div');
      bandOverlay.className = 'band-overlay';
      bandOverlay.id = `band-overlay-${i}`;

      const positions = bandCountNum === 4
        ? [
          { left: '10%', width: '10%' },
          { left: '25%', width: '10%' },
          { left: '45%', width: '10%' },
          { left: '80%', width: '10%' }
        ]
        : [
          { left: '10%', width: '10%' },
          { left: '25%', width: '10%' },
          { left: '35%', width: '10%' },
          { left: '45%', width: '10%' },
          { left: '80%', width: '10%' }
        ];

      bandOverlay.style.left = positions[i].left;
      bandOverlay.style.width = positions[i].width;
      bandOverlay.style.height = '98%';
      bandOverlay.style.top = '1%';
      bandOverlay.style.position = 'absolute';
      bandOverlay.style.zIndex = '1';

      resistorImageContainer.appendChild(bandOverlay);
    }

    const imgElement = document.createElement('img');
    imgElement.alt = '电阻图片';
    imgElement.style.width = '100%';
    imgElement.style.height = 'auto';
    imgElement.style.display = 'block';
    imgElement.style.position = 'relative';
    imgElement.style.zIndex = '2';
    imgElement.src = bandCountNum === 4 ? '四色环电阻.png' : '五色环电阻.png';

    resistorImageContainer.appendChild(imgElement);
  }
}

function selectColor(bandIndex, colorName) {
  const bandSelectors = document.querySelectorAll('.color-selector');
  const selectedOption = bandSelectors[bandIndex].querySelector('.selected-option');
  const colorObj = colorCodes.find(c => c.color === colorName);

  selectedOption.querySelector('.color-box').style.backgroundColor = colorObj.hex;
  selectedOption.querySelector('span').innerText = colorName;
  selectedOption.dataset.selectedColor = colorName;

  const bandOverlay = document.getElementById(`band-overlay-${bandIndex}`);
  if (bandOverlay) {
    bandOverlay.style.backgroundColor = colorObj.hex;
  }

  calculateFromColors();
}

function calculateFromColors() {
  const bandCount = document.querySelector('input[name="band-count"]:checked').value;
  if (bandCount === 'power') return; // 不在功率模式下计算阻值
  const bandSelectors = document.querySelectorAll('.color-selector');
  const bandCountNum = parseInt(bandCount);

  let digits = '';
  let multiplier = 1;
  let tolerance = '';

  for (let i = 0; i < bandCountNum; i++) {
    const selectedColorName = bandSelectors[i].querySelector('.selected-option').dataset.selectedColor;
    if (!selectedColorName) {
      document.getElementById('result-display').innerText = '请完整选择所有色环颜色';
      return;
    }

    const colorObj = colorCodes.find(c => c.color === selectedColorName);

    if ((i === 2 && bandCountNum === 4) || (i === 3 && bandCountNum === 5)) {
      multiplier = colorObj.multiplier;
    } else if (i === bandCountNum - 1) {
      tolerance = colorObj.tolerance;
    } else {
      digits += colorObj.value.toString();
    }
  }

  let resistanceValue = parseInt(digits) * multiplier;

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

function resetSelections() {
  const bandSelectors = document.querySelectorAll('.color-selector');
  bandSelectors.forEach(selector => {
    const selectedOption = selector.querySelector('.selected-option');
    if (selectedOption) {
      selectedOption.querySelector('.color-box').style.backgroundColor = '#fff';
      selectedOption.querySelector('span').innerText = '请选择颜色';
      delete selectedOption.dataset.selectedColor;
    }
  });
  document.getElementById('result-display').innerText = '';
  document.getElementById('power-size-info').innerText = '';
  // 重置功率输入框与结果
  diameterInput.value = '';
  lengthInput.value = '';
  powerResultDiv.innerText = '';

  const bandOverlays = document.querySelectorAll('.band-overlay');
  bandOverlays.forEach(band => {
    band.style.backgroundColor = 'transparent';
  });

  highlightPowerSegment(null);
}

function calculateBandsFromValue() {
  const resistanceInput = document.getElementById('resistance-input').value;
  const unitMultiplier = parseFloat(document.getElementById('unit-select').value);

  if (!resistanceInput || resistanceInput <= 0) {
    document.getElementById('bands-result').innerText = '请输入有效的阻值。';
    return;
  }

  const bandCount = parseInt(document.querySelector('input[name="band-count"]:checked').value);
  if (isNaN(bandCount)) {
    document.getElementById('bands-result').innerText = '请先选择四色环或五色环。';
    return;
  }

  let resistanceValue = resistanceInput * unitMultiplier;
  const significantFigures = bandCount === 4 ? 2 : 3;

  let digitsArray = [];
  let multiplierValue;

  if (resistanceValue < 1) {
    multiplierValue = 0.01;
    const scaledValue = resistanceValue / multiplierValue;
    let digits = Math.round(scaledValue);
    digitsArray = digits.toString().split('').map(Number);
    while (digitsArray.length < significantFigures) {
      digitsArray.unshift(0);
    }
  } else {
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

  const multiplierObj = colorCodes.find(c => c.multiplier === multiplierValue);
  if (multiplierObj) {
    bandColors.push(multiplierObj.color);
  } else {
    document.getElementById('bands-result').innerText = '无法计算对应的色环。';
    return;
  }

  const toleranceColor = bandCount === 4 ? '金色' : '棕色';
  bandColors.push(toleranceColor);

  document.getElementById('bands-result').innerText = `对应的色环颜色：${bandColors.join('、')}`;
  updateBands();
  const bandSelectors = document.querySelectorAll('.color-selector');
  for (let i = 0; i < bandColors.length; i++) {
    const colorName = bandColors[i];
    selectColor(i, colorName);
  }
}

// 功率与区域索引映射
const powerIndexMap = {
  '1/4w': 0,
  '1/2w': 1,
  '1w': 2,
  '2w': 3,
  '3w': 4,
  '5w': 5
};
function updatePowerResult() {
  const dVal = parseFloat(diameterInput.value);
  const lVal = parseFloat(lengthInput.value);

  const powerSizeInfoDiv = document.getElementById('power-size-info');

  if (isNaN(dVal) || isNaN(lVal)) {
    powerResultDiv.innerText = '输入直径和长度';
    highlightPowerSegment(null);
    powerSizeInfoDiv.innerText = '';
    return;
  }

  let minDistance = Infinity;
  let closestPower = '';
  let closestEntry = null;

  for (const entry of powerTable) {
    const distance = Math.abs(dVal - entry.diameter) + Math.abs(lVal - entry.length);
    if (distance < minDistance) {
      minDistance = distance;
      closestPower = entry.power;
      closestEntry = entry;
    }
  }

  powerResultDiv.innerText = `匹配最近似功率值约为：${closestPower}`;
  highlightPowerSegment(closestPower);

  // 在此处增加功率值名称显示
  if (closestEntry) {
    powerSizeInfoDiv.innerText = `${closestPower}参考尺寸：直径${closestEntry.diameter}mm，长度${closestEntry.length}mm`;
  } else {
    powerSizeInfoDiv.innerText = '';
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

// 输入变化时更新功率结果
diameterInput.addEventListener('input', updatePowerResult);
lengthInput.addEventListener('input', updatePowerResult);

// 初始化
init();

function highlightPowerSegment(powerValue) {
  const segments = document.querySelectorAll('.power-image-segments .power-segment');
  // 先移除所有区块的 highlight 类
  segments.forEach(segment => {
    segment.classList.remove('highlight');
  });

  // 如果有匹配的功率值，则为对应区块添加 highlight 类
  if (powerValue && powerIndexMap.hasOwnProperty(powerValue)) {
    const index = powerIndexMap[powerValue];
    segments[index].classList.add('highlight');
  }
}
