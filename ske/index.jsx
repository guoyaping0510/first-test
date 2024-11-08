import React, { useEffect, useRef } from 'react';
import './index.scss';

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

class generateSkeleton {
  constructor({ targetNode, config = {} }) {
    this.targetNode = targetNode.cloneNode(true);
    this.nodeQueue = [this.targetNode]; //skeId用于隐藏,pid用于合并重叠的div块
    this.isInterrupted = false;
    this.id = this.targetNode.id;
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
    if (node.nodeType !== Node.ELEMENT_NODE) {
      return reg;
    }
    if (
      node.childNodes &&
      Array.from(node.childNodes).some(
        (n) => n.nodeType === Node.TEXT_NODE && !!n.nodeValue.trim()
      )
    ) {
      this.addClassNames(node, ['ske-bg']); //text类型
      const style = getComputedStyle(node);
      node.style.display = style.display;
      reg = true;
    }
    if (['SVG'].includes(node.tagName.toUpperCase())) {
      this.addClassNames(node, ['ske-bg']);
      node.innerHTML = '';
      reg = true;
    }
    if (['I', 'TH', 'TD', 'A', 'CANVAS'].includes(node.tagName.toUpperCase())) {
      this.addClassNames(node, ['ske-bg']);
      reg = true;
    }
    if (
      node.tagName === 'IMG' ||
      /base64/.test(node.src) ||
      node.tagName === 'FIGURE'
    ) {
      node.removeAttribute('src');
      this.addClassNames(node, ['ske-bg', 'ske-btn']);
      reg = true;
    }
    if (node.tagName === 'SPAN') {
      this.addClassNames(node, ['ske-bg']);
      const style = getComputedStyle(node);
      node.style.display = style.display;
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
      // return;
    }

    //是继续遍历还是创建灰色块
    if (!node.hasChildNodes) {
      this.handleLeafNode(node);
      return;
    }

    //否则就往队列里面加node
    const children = node.childNodes;
    for (let i = 0; i < children.length; i++) {
      this.nodeQueue.push(children[i]);
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
      while (
        this.nodeQueue.length &&
        !deadline.didTimeout
        &&deadline.timeRemaining() > 0
      ) {
        //          debugger
        const currentNode = this.nodeQueue.shift();
        this.performTraverseNode(currentNode);
      }
      this.performWorkUnit();
    });
  }
}

export default function index({ loading, id = 'ske', children }) {
  const observer = useRef(null);
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
    observer.current = new MutationObserver(debounce(callback, 5000));
    observer.current.observe(targetNode, config);
  }

  useEffect(() => {
    const targetNode = document.getElementById(id);
    if (targetNode) {
      observeDOM(targetNode);
    }
  }, []);

  if (loading && JSON.stringify(cacheDOM) !== '{}') {
    return (
      <div id={id}>
        <div dangerouslySetInnerHTML={{ __html: cacheDOM }}></div>
      </div>
    );
  }

  return <div id={id}>{children}</div>;
}
