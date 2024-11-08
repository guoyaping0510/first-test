<script type="module"> 
console.log('init test')
function generateSkeleton(root) {
      console.log(root,'root99999',root&&root.id,root)
     let nodeQueue = [{ node: root, skeId: root.id, pid: 0 }], //skeId用于隐藏,pid用于合并重叠的div块
     isInterrupted = false,
     currentNode = null,
     SkeBoxes = [], //position skeId,pid
     Bgs = "",
     Borders = "",
     bgi = 0,
     bdi = 0,
     pid = 0;
 
  
     let interrupt=function() {
      isInterrupted = true;
    }
  
     let getPositionStyles=function(position){
      const {w,h,x,y}=position;
      return [
        "position: fixed",
        `width:${w}%`,
        `height:${h}%`,
        `left:${x}%`,
        `top:${y}%`
      ]
    }

     let isBackgroundSet=function(node) {
      if (!(node.nodeType === Node.ELEMENT_NODE)) {
        return;
      }
      const style = window.getComputedStyle(node);
      return (
        style.background !== "rgba(0, 0, 0, 0)" ||
        style.backgroundImage !== "none" ||
        style.backgroundColor !== "rgba(0, 0, 0, 0)"
      );
    }
  
     let hasBorder=function(node) {
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
  
     let getPosition=function(node,isBlock) {
      
      let { width, height, top, left } = node.getBoundingClientRect();
    
  //    if(isBlock){
  //     const styles=window.getComputedStyle(node, null);
  //     const pl=parseFloat(styles.getPropertyValue('padding-left'));
  //     const ml=parseFloat(styles.getPropertyValue('margin-left'));
  //     const pt=parseFloat(styles.getPropertyValue('padding-top'));
  //     const mt=parseFloat(styles.getPropertyValue('margin-top'));
  //     const pr=parseFloat(styles.getPropertyValue('padding-right'));
  //     const mr=parseFloat(styles.getPropertyValue('margin-right'));
  //     const pb=parseFloat(styles.getPropertyValue('padding-bottom'));
  //     const mb=parseFloat(styles.getPropertyValue('margin-bottom'));
  //     width=width-pl-pr-mr-ml;
  //     height=height-pt-pb-mr-ml; 
  //     left=left+pl;
  //     top=top+pt;
  //    }
   
   
      const { innerWidth, innerHeight } = window;
      // 必须符合要求的元素才渲染：有大小，并且在视图内;
      if (width > 5 && height > 5 && top < innerHeight && left < innerWidth&&(left+width)<innerWidth) {
        width = Number(((width / innerWidth) * 100).toFixed(2));
        height =Number( ((height / innerHeight) * 100).toFixed(2)) ;
        left = Number(((left / innerWidth) * 100).toFixed(2));
        top = Number(((top / innerHeight) * 100).toFixed(2));
        return { w: width, h: height, y: top, x: left };
      }
      return null;
    }
  
     let addBgs=function({ node, skeId }) {
      const positionInfo = getPosition(node);
      if (!positionInfo) {
        return null;
      }
      const nodeId = skeId || "";
      const { borderRadius, background, backgroundColor } = getComputedStyle(
        node,
        null
      ); 
      const positionStyles = getPositionStyles(positionInfo);
      const stylesInfo = positionStyles
        .concat([
          `background-color:${backgroundColor}`,
          `border-radius:${borderRadius}`,
        ])
        .join(";");
      Bgs += `<div data-ske-id="${nodeId}" style="${stylesInfo}"></div>`;
    }
  
     let addBorders=function({ node, skeId }) {
      const positionInfo = getPosition(node);
      if (!positionInfo) {
        return null;
      }
      const nodeId = skeId || "";
      const positionStyles = getPositionStyles(positionInfo);
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
  
      Borders += `<div  data-ske-id="${nodeId}" style="${stylesInfo}"></div>`;
    }
    
     let mergeDiv=function({ node, skeId, pid, position }) {
      const { borderRadius } = getComputedStyle(node, null);
      const newNodeInfo = {
        position,
        pid,
        skeId,
        borderRadius,
      };
      if (!SkeBoxes.length) {
        SkeBoxes.push(newNodeInfo);
        return;
      }
      const previousDivInfo = SkeBoxes[SkeBoxes.length - 1];
      const { w: w1, h: h1, x: x1, y: y1 } = previousDivInfo.position;
      const { borderRadius: borderRadius1 } = previousDivInfo;
      const { w: w2, h: h2, x: x2, y: y2 } = position;
  //     // 计算重叠度
  //     const xOverlap = Math.max(0, Math.min(x1 + w1, x2 + w2) - Math.max(x1, x2));
  //     const yOverlap = Math.max(0, Math.min(y1 + h1, y2 + h2) - Math.max(y1, y2));
  //     const overlap =
  //       (xOverlap * yOverlap) / (w1 * h1 + w2 * h2 - xOverlap * yOverlap);
      const xGap=Math.abs(x1+w1-x2);
      const yGap=Math.abs(y1+h1-y2)
      console.log(node.parentElement.className,x1+w1-x2,y1+h1-y2,x1,w1,y1,h1,xGap,yGap,x2,y2,'xGapYgap',pid,previousDivInfo.pid)
      if ((xGap<0.5||yGap<0.5)&&pid==previousDivInfo.pid) {
  
        //相同层级
        // 合并节点
       let n1 = {
          x: Math.min(x1, x2),
          y: Math.min(y1, y2),
          w: Math.max(x1 + w1, x2 + w2) - Math.min(x1, x2),
          h: Math.max(y1 + h1, y2 + h2) - Math.min(y1, y2),
        };
        SkeBoxes[SkeBoxes.length - 1] = {
          position: n1,
          borderRadius: Math.max(borderRadius1, borderRadius), //都使用第一个borderRaduis
          skeId,
          pid,
        };
        return;
      }
      SkeBoxes.push(newNodeInfo);
    }
  
     let createDiv=function({ node, skeId, pid,isText }) {
      if (!node) {
        return;
      }
      const positionInfo = getPosition(node,isText);
      if (!positionInfo) {
        return;
      }
      //合并灰色的块
     mergeDiv({ node, skeId, pid, position: positionInfo });
    }
  
     let handleLeafNode=function({ node, skeId, pid }) {
      if (node.nodeType === Node.ELEMENT_NODE) {
        node && createDiv({ node, skeId, pid });
      } else if (node.nodeType === Node.TEXT_NODE) {
        node && createDiv({ node: node.parentElement, skeId, pid }); //创建父元素的块 但是使用的是子元素的ids
      } else if (node.nodeType === Node.COMMENT_NODE) {
        //注释
      }
    }
  
     let handleIsInEnumableTags=function({ node }) {
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
      if (node.tagName === "INPUT"||node.tagName=='TEXTAREA') {
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
  
    let getIsVisible=function(node){
    const style=window.getComputedStyle(node);
    const isVisible = style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0' && node.offsetWidth > 0 && node.offsetHeight > 0;
    return isVisible;
    }
    let performTraverseNode=function({ node, skeId, pid }) {
      if (!node || isInterrupted) {
        return;
      }
      const isVisible=getIsVisible(node)
      if(!isVisible){
      return
      }
       if (
        node.childNodes &&
        Array.from(node.childNodes).some((n) => n.nodeType === Node.TEXT_NODE)
      ) {
        createDiv({ node, skeId, pid,isText:true });
        return;
      }
      //如果是一些特殊Tag 或者特殊的case 可以直接创建灰色块 不需要再进行递归
      const isInEnumableTags = handleIsInEnumableTags({ node });
      if (isInEnumableTags) {
        createDiv({ node, skeId, pid,isInEnumableTags });
        return;
      }
  
      //添加背景块
      if (isBackgroundSet(node)) {
        addBgs({ node, skeId });
      }
      if (hasBorder(node)) {
        addBorders({ node, skeId });
      }
      //添加线条
  
      //是继续遍历还是创建灰色块
      if (!node.hasChildNodes) {
        handleLeafNode({ node, skeId,pid });
        return;
      }
  
      //否则就往队列里面加node
      const children = node.childNodes;
      const currentPid = pid++;
      for (let i = 0; i < children.length; i++) {
        const currentNode = children[i];
        const newSkeId = skeId + currentNode.id;
        nodeQueue.push({
          node: currentNode,
          skeId: newSkeId,
          pid: currentPid,
        });
      }
    }
    
    let saveSke=function(){
     if (isInterrupted) {
        return;
      }
      console.log(SkeBoxes,'SkeBoxes');
      const blocks = SkeBoxes.reduce((pre, next) => {
        const { skeId, position, borderRadius } = next; 
        const positionStyles = getPositionStyles(position);
        const stylesInfo = positionStyles.concat([
          `border-radius:${borderRadius}`,
        ]);
        return (
          pre +
          `<div data-ske-id="${skeId || ""}" class="skeleton-common" 
        style="${stylesInfo.join(";")}" ></div>`
        );
      }, "");
      const skes = Bgs + Borders + blocks;
      console.log(skes,'skesskes')
      insertCacheDOM(skes)
      // putCacheDOM(skes);
      return skes;
    }
  
    let performWorkUnit=function() { 
      if (isInterrupted) {
        //如果中断直接返回
        return;
      }
      // 任务执行完毕后结束递归
      if (nodeQueue.length === 0) {
        //遍历完成
        saveSke();
        return;
      }
  
      requestIdleCallback((deadline) => {
        let currentNodeInfo;
        while (
          (currentNodeInfo = nodeQueue.shift()) &&
          !deadline.didTimeout &&
          deadline.timeRemaining() > 0
        ) {
          performTraverseNode(currentNodeInfo);
        }
        performWorkUnit();
      });
    }
    performWorkUnit()   
}
function observeDOM(id) { 
    
      const targetNode = document.getElementById(id);
//       let instance = null;
//       instance && instance.interrupt();
     let instance = generateSkeleton(targetNode); //初始化并执行
    //   instance.performWorkUnit()
//   // 选择目标节点
//   // 创建一个观察者对象
//   const observer = new MutationObserver(function (mutationsList, observer) {
//     setTimeout(() => {
//       instance && instance.interrupt();
//       instance = new generateSkeleton(); //初始化并执行
//       instance.performWorkUnit()
//     }, 3000);
//   });
//   // 观察者的配置（观察目标节点的子节点的变化和属性的变化）
//   const config = { attributes: true, childList: true, subtree: true };
//   // 传入目标节点和观察选项并开始观察
//   observer.observe(targetNode, config);
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
  background:#e9e9e9 linear-gradient(90deg, rgba(0, 0, 0, 0.06) 50%, rgba(0, 0, 0, 0.15) 50%, rgba(0, 0, 0, 0.06) 63%);
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
  //插入骨架屏样式f
  insertCss();
  // //获取缓存的骨架屏DOM结构
  // const cacheDOM = getCacheDOM();
  // //插入DOM结构
  // insertCacheDOM(cacheDOM);
  //监听DOM并生成skeleton
  setTimeout(()=>{
    observeDOM("seller-menu-container");
//     observeDOM("layoutbox");
     observeDOM("container");
  },3000)
   
}
init()
</script>