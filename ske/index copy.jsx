import React, { useEffect, useLayoutEffect } from 'react';
import './index.scss';

const minW = 10;
export default function ({ loading, children }) {
  const cacheDOM = JSON.parse(localStorage.getItem('ske-dom') || '{}');

  function handleDOM(current) {
    const clonedElement = current;
    //current.cloneNode(true);
    // current.cloneNode(true);
    // clonedElement.style.opacity=0;
    // document.body.append(clonedElement);
    traverseDOM(clonedElement);
    // const newCacheDOM=clonedElement.cloneNode(true);
    // newCacheDOM.style.opacity=1;
    // console.log(newCacheDOM,'cacheDOMcacheDOM')
    localStorage.setItem(
      'ske-dom',
      JSON.stringify(clonedElement && clonedElement.outerHTML)
    );
  }

  const init = () => {
    const targetNode = document.getElementById('ske');
    const config = { attributes: true, childList: true, subtree: true };
    // handleDOM(targetNode);
    const callback = function () {
      window.requestIdleCallback(() => {
        handleDOM(targetNode);
      });
    };
    callback();
    // const target = new MutationObserver(callback);
    // target.observe(targetNode, config);
  };

  function addParentElement(node) {
    if (!node) {
      return;
    }
    const pEle = node.parentElement;
    if (pEle && parseInt(node.getBoundingClientRect().width, 10) > minW) {
      pEle.classList.add('ske-bg', 'ske-btn');
    } else {
      addParentElement(pEle);
    }
  }

  function addClassNames(node, classnames) {
    if (Array.from(node.parentElement.classList || []).includes('ske-bg')) {
      return;
    }
    // console.log(
    //   node,
    //   node.offsetWidth,
    //   'offsetWidth',
    //   window.getComputedStyle(node),
    //   window.getComputedStyle(node).width,
    //   '123lllllll',
    //   node.getBoundingClientRect(),
    //   'mmmmmm',
    //   node.getBoundingClientRect().width,
    //   parseInt(node.getBoundingClientRect().width, 10),
    //   'parseInt(node.style.width,10)'
    // );

    node.classList.add(...classnames);
    // if (node.getBoundingClientRect().width < minW) {
    //   // node.parentElement.classList.add(...classnames)
    //   console.log(node, 'node99999', node.offsetWidth);
    //   // handleElementNode(node.parentElement);
    // } else {
    //   console.log(node,...classnames, '...classnames');
    //   node.classList.add(...classnames);
    // }
    return;
  }

  function handleElementNode(node) {
    if (!node) {
      return;
    }

    switch (node.nodeName) {
      case 'IMG': {
        node.removeAttribute('src');
        addClassNames(node, ['ske-bg', 'ske-btn']);
        break;
      }
      case 'SPAN': {
        addClassNames(node, ['ske-bg', 'ske-btn', 'ske-inline-block']);
        break;
      }
      case 'DIV': {
        addClassNames(node, ['ske-bg', 'ske-btn']);
        break;
      }
      case 'LABEL':
      case 'INPUT': {
        addClassNames(node, ['ske-bg', 'ske-btn', 'ske-input', 'ske-textarea']);
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

      // default:{
      //   addClassNames(node, ['ske-bg', 'ske-btn', 'ske-inline-block']);
      //   break;
      // }
    }
  }

  function traverseDOM(node) {
    if (!node) {
      return;
    }

    if (node.hasChildNodes()) {
      const children = node.childNodes;
      for (let i = 0; i < children.length; i++) {
        traverseDOM(children[i]);
      }
    } else {
      if (node.nodeType === Node.ELEMENT_NODE) {
        handleElementNode(node);
      } else if (node.nodeType === Node.TEXT_NODE) {
        addClassNames(node.parentElement, [
          'ske-bg',
          'ske-btn',
          'ske-inline-block',
        ]);
        // node.parentElement.classList.add('ske-bg');
      } else if (node.nodeType === Node.COMMENT_NODE) {
        //注释
      }
      return;
    }
  }

  useLayoutEffect(() => {
    const id = document.getElementById('ske');
    if (id) {
      // setTimeout(() => {
      init();
      // }, 5000);
    }
  }, []);

  // if (loading && JSON.stringify(cacheDOM) !== '{}') {
  //   return <div dangerouslySetInnerHTML={{ __html: cacheDOM }}></div>;
  // }

  return <div id="ske">{children}</div>;
}
