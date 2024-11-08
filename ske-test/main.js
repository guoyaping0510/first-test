class generate1Skeleton {
  constructor(root) {
    nodeQueue = [{ node: root, skeId: root.id, pid: 0 }]; //skeId用于隐藏,pid用于合并重叠的div块
    isInterrupted = false;
    currentNode = null;
    SkeBoxes = []; //position skeId,pid
    Bgs = "";
    Borders = "";
    bgi = 0;
    bdi = 0;
    pid = 0;
    this.performWorkUnit();
  }

  interrupt() {
    this.isInterrupted = true;
  }

  saveSkeleton() {
    if (isInterrupted) {
      return;
    }
    const blocks = this.SkeBoxes.reduce((pre, next) => {
      const { skeId, position, node } = next;
      const { borderRadius } = getComputedStyle(node, null);
      const positionStyles = this.getPositionStyles(position);
      const stylesInfo = positionStyles.concat([
        `border-radius:${borderRadius}`,
      ]);
      return (
        pre +
        `<div data-ske-id="${skeId || ""}" class="skeleton-common" 
      style="${stylesInfo.join(";")}" ></div>`
      );
    }, "");
    const skes = this.Bgs + this.Borders + blocks;
    putCacheDOM(skes);
    return skes;
  }

  isBackgroundSet(node) {
    if (!(node.nodeType === Node.ELEMENT_NODE)) {
      return;
    }
    const style = window.getComputedStyle(node);
    return (
      style.backgroundImage !== "none" ||
      style.backgroundColor !== "rgba(0, 0, 0, 0)"
    );
  }

  hasBorder(node) {
    if (!(node.nodeType === Node.ELEMENT_NODE)) {
      return;
    }
    const style = window.getComputedStyle(node);
    return (
      style.borderTopColor !== "rgba(0, 0, 0, 0)" || // 或者其他非transparent的颜色
      style.borderRightColor !== "rgba(0, 0, 0, 0)" ||
      style.borderBottomColor !== "rgba(0, 0, 0, 0)" ||
      style.borderLeftColor !== "rgba(0, 0, 0, 0)" ||
      style.borderTopWidth !== "0px" ||
      style.borderRightWidth !== "0px" ||
      style.borderBottomWidth !== "0px" ||
      style.borderLeftWidth !== "0px" ||
      style.borderTopStyle !== "none" ||
      style.borderRightStyle !== "none" ||
      style.borderBottomStyle !== "none" ||
      style.borderLeftStyle !== "none"
    );
  }

  getPosition(node) {
    const { width, height, top, left } = node.getBoundingClientRect();
    const { innerWidth, innerHeight } = window;
    // 必须符合要求的元素才渲染：有大小，并且在视图内;
    if (width > 5 && height > 5 && top < innerHeight && left < innerWidth) {
      width = ((width / innerWidth) * 100).toFixed(2) + "%";
      height = ((height / innerHeight) * 100).toFixed(2) + "%";
      left = ((left / innerWidth) * 100).toFixed(2) + "%";
      top = ((top / innerHeight) * 100).toFixed(2) + "%";
      return { w: width, h: height, y: top, x: left };
    }
    return null;
  }

  addBgs({ node, skeId }) {
    const positionInfo = this.getPosition(node);
    if (!positionInfo) {
      return null;
    }
    const nodeId = skeId || "";
    const { borderRadius, background, backgroundColor } = getComputedStyle(
      node,
      null
    );
    const { w, h, x, y } = positionInfo;
    const positionStyles = [
      "position: fixed",
      `width:${w}`,
      `height:${h}`,
      `left:${x}`,
      `top:${y}`,
    ];
    const stylesInfo = positionStyles
      .concat([
        `background-color:${backgroundColor}`,
        `border-radius:${borderRadius}`,
      ])
      .join(";");
    this.Bgs += `<div data-ske-id="${nodeId}" style="${stylesInfo}"></div>`;
  }

  addBorders({ node, skeId }) {
    const positionInfo = this.getPosition(node);
    if (!positionInfo) {
      return null;
    }
    const nodeId = skeId || "";
    const { w, h, x, y } = positionInfo;
    const positionStyles = [
      "position: fixed",
      `width:${w}`,
      `height:${h}`,
      `left:${x}`,
      `top:${y}`,
    ];
    const {
      borderRadius,
      backgroundColor,
      borderWidth,
      borderStyle,
      borderColor, //变成灰色系列
    } = getComputedStyle(node, null);
    const stylesInfo = positionStyles
      .concat([
        `background-color:${backgroundColor}`,
        `border-radius:${borderRadius}`,
      ])
      .concat([
        `border-width:${borderWidth}`,
        `border-style:${borderStyle}`,
        `border-color:#f4f4f4`,
        `border-radius:${borderRadius}`,
      ])
      .join(";");

    this.Borders += `<div  data-ske-id="${nodeId}" style="${stylesInfo}"></div>`;
  }

  mergeDiv({ node, skeId, pid, position, borderRadius }) {
    const { borderRadius } = getComputedStyle(node, null);
    const newNodeInfo = {
      position,
      pid,
      skeId,
      borderRadius,
    };
    if (!this.SkeBoxes.length) {
      this.SkeBoxes.push(newNodeInfo);
      return;
    }
    const previousDivInfo = this.SkeBoxes[this.SkeBoxes.length - 1];
    const { w: w1, h: h1, x: x1, y: y1 } = previousDivInfo.position;
    const { borderRadius: borderRadius1 } = previousDivInfo;
    const { w: w2, h: h2, x: x2, y: y2 } = position;
    // 计算重叠度
    const xOverlap = Math.max(0, Math.min(x1 + w1, x2 + w2) - Math.max(x1, x2));
    const yOverlap = Math.max(0, Math.min(y1 + h1, y2 + h2) - Math.max(y1, y2));
    const overlap =
      (xOverlap * yOverlap) / (w1 * h1 + w2 * h2 - xOverlap * yOverlap);

    if (overlap > 0.8 && pid == previousDivInfo.pid) {
      //相同层级
      // 合并节点
      n1 = {
        x: Math.min(x1, x2),
        y: Math.min(y1, y2),
        w: Math.max(x1 + w1, x2 + w2) - Math.min(x1, x2),
        h: Math.max(y1 + h1, y2 + h2) - Math.min(y1, y2),
      };
      this.SkeBoxes[this.SkeBoxes - 1] = {
        position: n1,
        borderRadius: Math.min(borderRadius1, borderRadius), //都使用第一个borderRaduis
        skeId,
        pid,
      };
      return;
    }
    this.SkeBoxes.push(newNodeInfo);
  }

  createDiv({ node, skeId, pid }) {
    if (!node) {
      return;
    }
    const positionInfo = this.getPosition(node);
    if (!positionInfo) {
      return;
    }
    //合并灰色的块
    this.mergeDiv({ node, skeId, pid, position: positionInfo.position });
  }

  handleLeafNode({ node, skeId, pid }) {
    if (node.nodeType === Node.ELEMENT_NODE) {
      node && this.createDiv({ node, skeId, pid });
    } else if (node.nodeType === Node.TEXT_NODE) {
      node && this.createDiv({ node: node.parentElement, skeId, pid }); //创建父元素的块 但是使用的是子元素的ids
    } else if (node.nodeType === Node.COMMENT_NODE) {
      //注释
    }
  }

  handleIsInEnumableTags({ node }) {
    let reg = false;
    // 将所有拥有 textChildNode 子元素的元素的文字颜色设置成背景色，这样就不会在显示文字了。
    if (node.nodeType != Node.ELEMENT_NODE) {
      return reg;
    }
    if (
      node.childNodes &&
      Array.from(node.childNodes).some((n) => n.nodeType === Node.TEXT_NODE)
    ) {
      reg = true;
    }
    // 隐藏所有 svg 元素
    if (node.tagName === "svg") {
      reg = true;
    }

    if (node.tagName === "A") {
      reg = true;
    }

    if (
      node.tagName === "IMG" ||
      /base64/.test(node.src) ||
      node.tagName === "FIGURE"
    ) {
      reg = true;
    }

    // 输入框元素
    if (node.tagName === "INPUT") {
      reg = true;
    }

    // CANVAS
    if (node.tagName === "CANVAS") {
      reg = true;
    }

    if (
      node.nodeType === Node.ELEMENT_NODE &&
      (node.tagName === "BUTTON" ||
        (node.tagName === "A" && node.getAttribute("role") === "button"))
    ) {
      reg = true;
    }
    return reg;
  }

  performTraverseNode({ node, skeId, pid }) {
    if (!node || this.isInterrupted) {
      return;
    }
    //如果是一些特殊Tag 或者特殊的case 可以直接创建灰色块 不需要再进行递归
    const isInEnumableTags = this.handleIsInEnumableTags({ node });
    if (isInEnumableTags) {
      this.createDiv({ node, skeId, pid });
      return;
    }

    //添加背景块
    if (this.isBackgroundSet(node)) {
      this.addBgs({ node, skeId });
    }
    if (this.hasBorder(node)) {
      this.addBorders({ node, skeId });
    }
    //添加线条

    //是继续遍历还是创建灰色块
    if (!node.hasChildNodes) {
      this.handleLeafNode({ node, skeId });
      return;
    }

    //否则就往队列里面加node
    const children = node.childNodes;
    const currentPid = this.uid++;
    for (let i = 0; i < children.length; i++) {
      const currentNode = children[i];
      const newSkeId = skeId + currentNode.id;
      this.nodeQueue.push({
        node: currentNode,
        skeId: newSkeId,
        uid: currentPid,
      });
    }
  }

  performWorkUnit() {
    if (this.isInterrupted) {
      //如果中断直接返回
      return;
    }
    // 任务执行完毕后结束递归
    if (this.nodeQueue.length === 0) {
      //遍历完成
      this.saveSkeleton();
      return;
    }

    requestIdleCallback((deadline) => {
      let currentNodeInfo;
      while (
        (currentNodeInfo = this.nodeQueue.shift()) &&
        !deadline.didTimeout &&
        deadline.timeRemaining() > 0
      ) {
        this.performTraverseNode(currentNodeInfo);
      }
      performWorkUnit();
    });
  }
}

function observeDOM(id) {
  const targetNode = document.getElementById(id);
  let instance = null;
  // 选择目标节点
  // 创建一个观察者对象
  const observer = new MutationObserver(function (mutationsList, observer) {
    setTimeout(() => {
      instance && instance.interrupt();
      instance = new generateSkeleton(); //初始化并执行
    }, 3000);
  });
  // 观察者的配置（观察目标节点的子节点的变化和属性的变化）
  const config = { attributes: true, childList: true, subtree: true };
  // 传入目标节点和观察选项并开始观察
  observer.observe(targetNode, config);
}

function getDbObjectStore() {
  const dbName = "ske-database";
  // 数据库版本号（自定义）
  const dbVersion = 1;
  // 数据库对象
  let db;
  // 打开一个数据库并获取其reques对象
  const request = indexedDB.open(dbName, dbVersion);
  // 数据库打开失败
  request.onerror = (event) => {
    console.error("打开数据库失败！", event.target.error);
  };
  // 数据库打开成功
  request.onsuccess = (event) => {
    // 数据库对象
    db = event.target.result;
    console.log("打开数据库成功", db);
  };
  // 数据库版本变更时候会触发
  request.onupgradeneeded = (event) => {
    // 数据库对象
    db = event.target.result;
    if (!db.objectStoreNames.contains("ske-store")) {
      const store = db.createObjectStore("ske-store", { keyPath: "id" });
      // 可以在这里定义索引
    }
  };
  const transaction = db.transaction(["ske-store"], "readwrite");
  // 获取可以进行数据增删改查的objectStore对象
  const objectStore = transaction.objectStore("ske-store");
  return objectStore;
}

function putCacheDOM(cacheDOM) {
  const path = window.location.origin + window.location.pathname;
  //根据当前路由从DB中取出
  const objectStore = getDbObjectStore();
  console.log(cacheDOM,'cacheDOM123')
  // 更新cacheDOM
  objectStore.put({ id: path, cacheDOM });
}

function getCacheDOM() {
  const objectStore = getDbObjectStore();
  // 查询cacheDOM
  const cacheDOM = objectStore.get(path);
  return cacheDOM;
}

function insertCacheDOM(cacheDOM) {
  if (!cacheDOM) {
    return;
  }
  const appendDiv = document.createElement("div");
  appendDiv.style.position = "fixed";
  appendDiv.style.zIndex = "1000000";
  appendDiv.innerHTML = cacheDOM;
  document.body.append(appendDiv);
}

function insertCss() {
  const styleTag = document.createElement("style");
  styleTag.innerHTML = `.skeleton-common {
  position: fixed;
  background: #f4f4f4
    linear-gradient(
      90deg,
      rgba(0, 0, 0, 0.06) 50%,
      rgba(0, 0, 0, 0.15) 50%,
      rgba(0, 0, 0, 0.06) 63%
    );
  background-size: 400% 100%;
  animation-name: loading;
  animation-duration: 1.4s;
  animation-timing-function: ease;
  animation-iteration-count: infinite;
}

@keyframes loading {
  0% {
    background-position: 100% 50%;
  }
  to {
    background-position: 0% 50%;
  }
}

@keyframes opacity {
  0% {
    opacity: 1;
  }
  50% {
    opacity: 0.4;
  }
  100% {
    opacity: 1;
  }
}
`;
  document.head.append(styleTag);
}

function init() {
  if (!window) {
    return;
  }
  //插入骨架屏样式
  insertCss();
  //获取缓存的骨架屏DOM结构
  const cacheDOM = getCacheDOM();
  //插入DOM结构
  insertCacheDOM(cacheDOM);
  //监听DOM并生成skeleton
  observeDOM("layoutbox");
}
init()
