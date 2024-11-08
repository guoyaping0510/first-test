import React, { useEffect } from 'react';
import './index.scss';

class generateSkeleton {
  constructor({ targetNode, config = {} }) {
    this.targetNode = targetNode;
    this.nodeQueue = [targetNode]; //skeId用于隐藏,pid用于合并重叠的div块
    this.isInterrupted = false;
    this.id = targetNode.id;
    this.config = config;
    this.minWidth = config.minWidth || 10;
    this.minHeight = config.minHeight || 10;
    this.minGap = config.minGap || 0.5;
    this.defaultBgColor = config.defaultBgColor;
  }

  interrupt() {
    this.isInterrupted = true;
  }

  saveSkeleton() {
    if (this.isInterrupted) {
      return;
    }
    putCacheDOM(this.targetNode, this.id);
  }

  isBackgroundSet(node) {
    if (!(node.nodeType === Node.ELEMENT_NODE)) {
      return;
    }
    const style = window.getComputedStyle(node);
    return (
      style.background !== 'rgba(0, 0, 0, 0)' ||
      style.backgroundImage !== 'none' ||
      style.backgroundColor !== 'rgba(0, 0, 0, 0)'
    );
  }

  handleLeafNode(node) {
    if (node.nodeType === Node.ELEMENT_NODE) {
      node && this.addClassNames(node, ['ske-bg']);
    } else if (node.nodeType === Node.TEXT_NODE) {
      node && this.addClassNames(node.parentElement, ['ske-bg']); //创建父元素的块 但是使用的是子元素的ids
    } else if (node.nodeType === Node.COMMENT_NODE) {
      //注释
    }
  }

  addClassNames(node, classnames) {
    if (Array.from(node.parentElement.classList || []).includes('ske-bg')) {
      return;
    }
    node.classList.add(...classnames);
  }

  handleIsInEnumableTags(node) {
    let reg = false;
    // 将所有拥有 textChildNode 子元素的元素的文字颜色设置成背景色，这样就不会在显示文字了。
    if (node.nodeType != Node.ELEMENT_NODE) {
      return reg;
    }
    if (
      node.childNodes &&
      Array.from(node.childNodes).some(
        (n) => n.nodeType === Node.TEXT_NODE && !!n.nodeValue.trim()
      )
    ) {
      this.addClassNames(node, ['ske-bg']); //text类型
      reg = true;
    }
    if (['I', 'TH', 'TD', 'SVG', 'A', 'CANVAS'].includes(node.tagName)) {
      this.addClassNames(node, ['ske-bg']);
      reg = true;
    }
    if (
      node.tagName === 'IMG' ||
      /base64/.test(node.src) ||
      node.tagName === 'FIGURE'
    ) {
      this.addClassNames(node, ['ske-bg', 'ske-btn']);
      reg = true;
    }
    if (node.tagName === 'SPAN') {
      this.addClassNames(node, ['ske-bg', 'ske-inline-block']);
      reg = true;
    }

    // 输入框元素
    if (['LABEL', 'INPUT'].includes(node.tagName)) {
      this.addClassNames(node, ['ske-bg', 'ske-input']);
      reg = true;
    }

    if (
      node.nodeType === Node.ELEMENT_NODE &&
      (node.tagName === 'BUTTON' ||
        (node.tagName === 'A' && node.getAttribute('role') === 'button'))
    ) {
      this.addClassNames(node, ['ske-bg', 'ske-btn']);
      reg = true;
    }
    if (node.tagName === 'TEXTAREA') {
      this.addClassNames(node, ['ske-bg', 'ske-btn']);
      reg = true;
    }
    return reg;
  }

  getIsVisible(node) {
    const style = window.getComputedStyle(node);

    return (
      style.display !== 'none' &&
      style.visibility !== 'hidden' &&
      style.opacity !== '0'
      // && node.offsetWidth > 0 &&
      // node.offsetHeight > 0
      // && width > this.minWidth &&
      // height > this.minHeight
    );
  }

  performTraverseNode(node) {
    if (!node || this.isInterrupted) {
      return;
    }
    if (node.nodeType !== Node.ELEMENT_NODE) {
      return;
    }

    const isVisible = this.getIsVisible(node);
    if (!isVisible) {
      return;
    }
    //如果是一些特殊Tag 或者特殊的case 可以直接创建灰色块 不需要再进行递归
    const isInEnumableTags = this.handleIsInEnumableTags(node);
    if (isInEnumableTags) {
      return;
    }

    //是继续遍历还是创建灰色块
    if (!node.hasChildNodes) {
      this.handleLeafNode(node);
      return;
    }

    //否则就往队列里面加node
    const children = node.childNodes;
    for (let i = 0; i < children.length; i++) {
      this.nodeQueue.push(node);
    }
  }

  performWorkUnit() {
    debugger;
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
      while (
        this.nodeQueue.length
        // &&!deadline.didTimeout
        // &&deadline.timeRemaining() > 0
      ) {
        //          debugger
        const currentNode = this.nodeQueue.shift();
        this.performTraverseNode(currentNode);
      }
      this.performWorkUnit();
    });
  }
}

function getCacheDOM(id) {
  const path = window.location.origin + window.location.pathname;
  const key = path + '-' + id;
  let cacheDOM;
  try {
    cacheDOM = JSON.parse(localStorage.getItem(key) || '{}');
  } catch (e) {
    console.log(e);
  }
  return cacheDOM;
}

function putCacheDOM(cacheDOM, id) {
  const path = window.location.origin + window.location.pathname;
  const key = path + '-' + id;
  localStorage.setItem(key, JSON.stringify(cacheDOM && cacheDOM.outerHTML));
}

export default function index({ loading, id = 'ske', children }) {
  const cacheDOM = getCacheDOM(id);

  function debounce(func, delay) {
    let timer;
    return function () {
      clearTimeout(timer);
      timer = setTimeout(() => {
        func.apply(this, arguments);
      }, delay);
    };
  }

  function observeDOM(targetNode) {
    const config = { attributes: true, childList: true, subtree: true };
    const callback = function () {
      const instance = new generateSkeleton({ targetNode });
      instance.performWorkUnit();
    };
    setTimeout(() => {
      callback();
    }, 5000);
    // const target = new MutationObserver(debounce(callback,5000));
    // target.observe(targetNode, config);
  }

  // useEffect(() => {
  //   const targetNode = document.getElementById(id);
  //   if (targetNode) {
  //     observeDOM(targetNode);
  //   }
  // }, []);

  if (loading && JSON.stringify(cacheDOM) !== '{}') {
    return <div dangerouslySetInnerHTML={{ __html: cacheDOM }}></div>;
  }

  return <div id={id}>{children}</div>;
}

//   (function () {
//   function insertCss() {
//     const styleTag = document.createElement("style");
//     styleTag.innerHTML = `.skeleton-common {
//         position: fixed;
//         background:linear-gradient(90deg, rgba(0, 0, 0, 0.06) 50%, rgba(0, 0, 0, 0.15) 50%, rgba(0, 0, 0, 0.06) 63%);
//         background-size: 400% 100%;
//         animation-name: loading;
//         animation-duration: 1.4s;
//         animation-timing-function: ease;
//         animation-iteration-count: infinite;
//       }

//       @keyframes loading {
//         0% {
//           background-position: 100% 50%;
//         }
//         to {
//           background-position: 0% 50%;
//         }
//       }

//       @keyframes opacity {
//         0% {
//           opacity: 1;
//         }
//         50% {
//           opacity: 0.4;
//         }
//         100% {
//           opacity: 1;
//         }
//       }
//       `;
//     document.head.append(styleTag);
//   }

//   function getCacheDOM(configs) {
//     const path = window.location.origin + window.location.pathname;
//     let cacheDOM = "";
//     configs.forEach((config) => {
//       let key = path + '-'+config.id;
//      try{
//       const currentCacheDom = JSON.parse(localStorage.getItem(key) || "{}");
//       const {innerWidth,innerHeight}=window;

//       if(Math.abs(currentCacheDom.innerWidth-innerWidth)<100&&Math.abs(currentCacheDom.innerHeight-innerHeight)<100){
//         cacheDOM += currentCacheDom.DOM;
//       }

//      }catch(e){
//        console.log(e)
//      }
//     });
//     return cacheDOM;
//   }

//   function insertCacheDOM({cacheDOM}) {

//     if (!cacheDOM) {
//       return;
//     }
//     const appendDiv = document.createElement("div");
//     appendDiv['data-ske-id']='ske-root';
//     appendDiv.style.position = "fixed";
//     appendDiv.style.zIndex = "1000000";
//     appendDiv.style.background='#f4f4f4';
//     appendDiv.innerHTML = cacheDOM;
//     document.body.append(appendDiv);
//   }

//   function initDestroyMethod(){
//     window.skeDestroyById=function(ids){
//         const list=ids.reduce((pre,next)=>{
//             return pre.concat(Array.from(document.querySelectorAll(`[data-ske-id*='ske-${next}']`)))
//         },[])
//         list.forEach(item=>item.remove())
//     }
//   }
//   function init() {
//     insertCss()
//     const configs = window.ske_configs || [];
//     const cacheDOMs = getCacheDOM(configs);
//     insertCacheDOM(cacheDOMs);
//     initDestroyMethod()
//   }
//   init();
// })();

//   function init() {

//     if (!window) {
//       return;
//     }

//     window.ske_configs=[{type:'class',className:'keyword-detail',minWidth:2,minHeight:2},{id:'route'},{type:'class',className:'business-opportunity-selection'}]
// //    window.ske_configs=[{id:'app'},{id:'business-equity'},{id:'content-div'},{id:'icestarkNode'},{id:'page-company-profile'},{id:'container'}]

// //         window.ske_configs=[{type:'class',className:'preference-general'},{type:'class',className:'condition-effect week'},{id:'J-condition-column'},{type:'class',className:'product-effective'}]
// //     window.ske_configs=[{type:'class',className:'rank-list-container'}]
// //      window.ske_configs=[{id:'root'},{id:'main-root'},{id:'seller-home-page-root'},{id:'page-company-profile'},{id:'container'},{id:'layoutbox'},{id:'widget-17'},{id:'normal-list-container-id'},{id:'app'},{id:'icestarkNode'},{type:'class',className:'product-effective'},{type:'class',className:'contentWrap--ONBQVtoe'}]
// //   window.ske_configs=[{id:'icestark-child-app'},{id:'app'},{type:'class',className:'preference-general'},{type:'class',className:'condition-effect week'},{type:'class',className:'condition-column'}];

//     setTimeout(() => {
//       window.ske_configs.forEach((config) => {
//         observeDOM(config);
//       });
//     }, 5000);
//   }
//   init();
