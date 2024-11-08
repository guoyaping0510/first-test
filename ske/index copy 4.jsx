import React, { useEffect, useState } from 'react';
import './index.scss';

const minW = 13;
const zeroW = 2;
const minH = 9;
const zeroH = 2;
let i = 0;
let bi = 0;
export default function ({ loading, children }) {
  const cacheDOM = JSON.parse(localStorage.getItem('ske-dom') || '{}');

  function handleDOM(current) {
    const clonedElement = current.cloneNode(true);
    traverseDOM(clonedElement);
    localStorage.setItem(
      'ske-dom',
      JSON.stringify(clonedElement && clonedElement.outerHTML)
    );
  }

  const init = () => {
    const targetNode = document.getElementById('ske');
    const config = { attributes: true, childList: true, subtree: true };
    const callback = function () {
      // handleDOM(targetNode);
      window.requestIdleCallback(() => {
        handleDOM(targetNode);
      });
    };
    // callback();
    const target = new MutationObserver(callback);
    target.observe(targetNode, config);
  };

  function addClassNames(node, classnames) {
    if (Array.from(node.parentElement.classList || []).includes('ske-bg')) {
      return;
    }
    node.classList.add(...classnames);
    // createDiv(node);
  }

  function handleElementNode(node) {
    if (!node) {
      return;
    }
    switch (node.nodeName) {
      case 'IMG': {
        // const { width, height } = node.getBoundingClientRect();
        // node.style.width = `${width}px`;
        // node.style.height = `${height}px`;
        node.removeAttribute('src');
        // createDiv(node);
        addClassNames(node, ['ske-bg', 'ske-btn']);
        break;
      }
      case 'SPAN': {
        addClassNames(node, ['ske-bg', 'ske-inline-block']);
        break;
      }
      case 'LABEL':
      case 'INPUT': {
        addClassNames(node, ['ske-bg', 'ske-input']);
        break;
      }
      case 'BUTTON': {
        addClassNames(node, ['ske-bg', 'ske-btn']);
        // if (parseInt(node.getBoundingClientRect().width, 10) < minW) {
        //   handleElementNode(node.parentElement);
        // } else {
        //   node.classList.add('ske-bg', 'ske-btn');
        // }
        // node.classList.add('ske-bg', 'ske-btn');

        break;
      }

      case 'TEXTAREA': {
        addClassNames(node, ['ske-bg', 'ske-textarea']);
        break;
      }

      default: {
        addClassNames(node, ['ske-bg']);
      }
    }
  }

  function traverseDOM(node) {
    if (!node) {
      return;
    }

    // if (isBackgroundSet(node)) {
    //   addBgs(node);
    // }
    // if (hasBorder(node)) {
    //   addBorder(node);
    // }

    if (node.hasChildNodes()) {
      const children = node.childNodes;
      for (let i = 0; i < children.length; i++) {
        traverseDOM(children[i]);
      }
    } else {
      // console.log(node, 'node123', node.getBoundingClientRect());
      if (node.nodeType === Node.ELEMENT_NODE) {
        // addClassNames(node);
        handleElementNode(node);
      } else if (node.nodeType === Node.TEXT_NODE) {
        addClassNames(node.parentElement, ['ske-bg']);
        // node.parentElement.classList.add('ske-bg');
      } else if (node.nodeType === Node.COMMENT_NODE) {
        //注释
      }
    }
  }

  useEffect(() => {
    const id = document.getElementById('ske');
    if (id) {
      init();
    }
  }, []);


  if (loading && JSON.stringify(cacheDOM) !== '{}') {
    return <div dangerouslySetInnerHTML={{ __html: cacheDOM }}></div>;
  }

  return <React.Fragment id="ske">{children}</React.Fragment>;
}