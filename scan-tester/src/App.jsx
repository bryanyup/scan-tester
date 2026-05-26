import { useState, useEffect, useRef } from 'react'
import './App.css'
import JsBarcode from 'jsbarcode'
import { BarcodeDetector } from "barcode-detector/ponyfill";

function App() {

  const [scannedValue, setScannedValue] = useState('')
  const [scanCount, setScanCount] = useState(0)


  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const barcodeRef = useRef(null) //empty box labeled barcodeRef
  const scanDialogRef = useRef(null)
  const stopFrameRef = useRef(null)
  const lastDialogRef = useRef(null)

  const [products, setProducts] = useState([
    { productID: "PR001", name: "Milk", quantity: 2 },
    { productID: "PR002", name: "Eggs", quantity: 4 },
    { productID: "PR003", name: "Bread", quantity: 6 }
  ])

  const addButton = () => {
    if (scanCount === 0 || scannedValue === '') {
      alert("Please scan your Products before adding")
      return
    }
    else {
      setProducts(prevProducts =>
        prevProducts.map(p =>
          p.productID === scannedValue ?
            { ...p, quantity: p.quantity + scanCount } : p
        )
      )
      alert("Product Has been Added")
      closeScanner()
      setScannedValue('')
      setScanCount(0)
    }
  }

  const productBarcode = "PR002"

  const addQuantity = (barcode) => {
    setProducts(prevProducts => { //mandatory for reading the state
      const exist = prevProducts.some(p => p.productID === barcode)

      if (exist) {
        alert("Product has been added")
        return prevProducts
      }

      else {
        alert("Product does not exist")
        return prevProducts
      }
    })
  }

  const openConfirmation = () => {
    lastDialogRef.current?.showModal()
  }

  const closeConfirmation = () => {
    lastDialogRef.current?.close()
  }

  const openScanner = () => {
    scanDialogRef.current?.showModal()
    scan()
  }

  const closeScanner = () => {
    videoRef.current.srcObject?.getTracks().forEach(track => track.stop())
    cancelAnimationFrame(stopFrameRef.current)
    scanDialogRef.current?.close()
  }


  useEffect(() => {
    JsBarcode(
      barcodeRef.current, //where to put the barcode (current is basically the data inside the container)
      productBarcode, // What barcode data
      {
        format: "CODE128", //type of barcode (even if we change the format it won't affect the scanning)
        width: 2, //how thick the lines are
        height: 100, // how tall the barcode is
        displayValue: true //show the text below (basically whatss in the productBarcode)
      })
  }, [])


  const scan = async () => {

    try {
      //Step 1. Setting Up the Camera
      const camera = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      }) //if we want microphone we'll use audio
      videoRef.current.srcObject = camera //basically its like 
      // <video srv"camera"></video
      videoRef.current.play()

      await new Promise(resolve => {
        //promise means wait for something to finish then continue
        //this is basically used for every event listener possible
        videoRef.current.onloadedmetadata = () => resolve()
        //runs when video is ready, onloadmetadata is when info loads
      })

      //Step 2. Create the barcode Scanner
      const detector = new BarcodeDetector()

      //Step 3. Keep checking for barcodes
      const checkFrame = async () => {

        // //try to detect a barcode
        const barcode = await detector.detect(videoRef.current)

        if (barcode.length > 0) { //if barcode is scanned
          const [{ rawValue: scannedBarcode }] = barcode //raw value is the default 0bject given by the API library
          setScannedValue(scannedBarcode)

          const product = products.find(p => p.productID === scannedBarcode)

          if (!(product)) {
            alert("Barcode is not valid")
            alert('Added Product will be reset')
            setScannedValue('')
            setScanCount(0)
          }

          else {
            alert("Product has been added")
            setScanCount(prev => prev + 1)
            setScannedValue(scannedBarcode)
          }


          // scannedProducts()
          // addQuantity(scannedBarcode)
          //  videoRef.current.srcObject.getTracks().forEach(track => track.stop())
        }

        //used to constantly scan so you'll found the result
        stopFrameRef.current = requestAnimationFrame(checkFrame)
        //basically anything to constantly keep it running must use this
      }
      stopFrameRef.current = requestAnimationFrame(checkFrame)
    } catch (error) {
      console.error("Camera error:")
    }

  }

  return (
    <>
      <div className='App'>

        <h1>Scanning in React</h1>

        <button onClick={() => {
          openScanner()
        }
        }>Scanner Button</button>

        <h2>Scan Value: {scannedValue}</h2>

        <div className='showProduct'>
          {products.map(p => {
            return (
              <>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                  <div key={p.productID} style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                    <p style={{ marginBottom: 20 }}>ID Product: {p.productID}, Name Product: {p.name},  Quantity: {p.quantity}</p>
                  </div>
                </div>
              </>
            )
          })}
        </div>
        <div>
          <h3>Scan this barcode</h3>
          <svg ref={barcodeRef}></svg>
        </div>
      </div>

      <dialog ref={scanDialogRef}>
        <button onClick={() => {
          closeScanner()
        }}>X</button>
        <div>Scan your barcode inside the dialog:</div>
        {/* Camera feed */}

        <video
          ref={videoRef}
          style={{ width: 300 }}
        ></video>

        <div className='div-scan'>
          List of Scan:
          <div>
            <p>Product ID: {scannedValue}</p>
            <p>Name: {products.find(p => p.productID === scannedValue)?.name
              || "-"
            }</p>
            <p>Quantity: {scanCount}</p>
          </div>
          <button onClick={openConfirmation}>Add button</button>
        </div>
      </dialog>

      <dialog ref={lastDialogRef}>
        <p>Are you sure you want to finish adding this Product?</p>
        <button onClick={() => {
          addButton()
          closeConfirmation()
        }
        }>Yes</button>
        <button onClick={closeConfirmation}>No</button>
      </dialog>
    </>
  )
}
export default App