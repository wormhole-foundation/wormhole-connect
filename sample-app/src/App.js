import React from 'react';
import './App.css';

function fallbackCopyTextToClipboard(text) {
  const textArea = document.createElement('textarea')
  textArea.value = text

  // Avoid scrolling to bottom
  textArea.style.top = '0'
  textArea.style.left = '0'
  textArea.style.position = 'fixed'

  document.body.appendChild(textArea)
  textArea.focus()
  textArea.select()

  try {
    const successful = document.execCommand('copy')
    const msg = successful ? 'successful' : 'unsuccessful'
    console.log('Fallback: Copying text command was ' + msg)
    document.body.removeChild(textArea)
    return true
  } catch (err) {
    console.error('Fallback: Oops, unable to copy', err)
    document.body.removeChild(textArea)
    return false
  }
}

export function copyTextToClipboard(text) {
  if (navigator.clipboard) {
    navigator.clipboard.writeText(text).then(
      function () {
        console.log('Async: Copying to clipboard was successful!')
        return true
      },
      function (err) {
        console.error('Async: Could not copy text: ', err)
        return fallbackCopyTextToClipboard(text)
      }
    )
  }
  return fallbackCopyTextToClipboard(text)
}

function App() {
  const script = `
    <div id="wormhole-connect"></div>
    <script src="https://wormhole-foundation.github.io/wormhole-connect/main.f9c9a413.js"></script>
    <script src="https://wormhole-foundation.github.io/wormhole-connect/718.06852233.chunk.js"></script>
    <link rel="https://wormhole-foundation.github.io/wormhole-connect/main.ba17183d.css" />
  `

  return (
    <div className="App" style={{marginBottom: '60px'}}>
      <div style={{marginTop: '60px', textAlign: 'center', marginBottom: '16px'}}>My application</div>
      <div
        style={{padding: '16px', backgroundColor: 'rgba(0,0,0,0.05)', border: '1px solid rgba(0,0,0,0.3', borderRadius: '8px', maxWidth: '150px', margin: 'auto', cursor: 'pointer'}}
        // style="padding: 16px; background-color: rgba(0,0,0,0.2); border: 1px solid black"
        onClick={() => copyTextToClipboard(script)}
      >
        Copy script
      </div>
    </div>
  );
}

export default App;
