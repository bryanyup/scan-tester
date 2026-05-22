import { useState, useEffect, useRef } from 'react'
import './App.css'
import JsBarcode from 'jsbarcode'
import { BarcodeDetector } from "barcode-detector/ponyfill";

function App() {

  const [scannedValue, setScannedValue] = useState('Nothing scanned yet')
  const [currentScan, setCurrentScan] = useState('')

  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const barcodeRef = useRef(null) //empty box labeled barcodeRef

  const [products, setProducts] = useState([
    { productID: "PR001", name: "Milk", quantity: 2 },
    { productID: "PR002", name: "Eggs", quantity: 4 },
    { productID: "PR003", name: "Bread", quantity: 6 }
  ])

  const productBarcode = 'PR002'

  const addQuantity = (barcode) => {
    setProducts(prevProducts => //mandatory for reading the state
      prevProducts.map(p =>
        p.productID === barcode
          ? { ...p, quantity: p.quantity + 1 }
          : p
      )
    )
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
      //Step 1. Setting Up the Camera
      const camera = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      })
      videoRef.current.srcObject = camera
      videoRef.current.play()

      //Step 2. Create the barcode Scanner
      const detector = new BarcodeDetector()

      //Step 3. Keep checking for barcodes
      const checkFrame = async () => {
        const canvas = canvasRef.current
        const ctx = canvas.getContext('2d')

        //draw what the camera sees onto the canvas
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height)

        //try to detect a barcode
        const barcode = await detector.detect(canvas)

        //If we found the barcode we show it
        if (barcode.length > 0) {
          const scannedBarcode = barcode[0].rawValue
          setScannedValue(scannedBarcode)
          addQuantity(scannedBarcode)
          alert("Product has Successfully been added")

          videoRef.current.srcObject.getTracks().forEach(track => track.stop())
        }

        //keep checking every frame
        requestAnimationFrame(checkFrame)
      }
      checkFrame()
    }




  return (
    <>
      <div className='App'>

        <h1>Scanning in React</h1>

        {/* Button For Scanning */}
        <button
            onClick={() => {
              scan()
            }}
          >
            Start Scanning Your Barcode
          </button>
        {/* Camera feed */}
        <video
          ref={videoRef}
          style={{ width: 300 }}
        ></video>

        <canvas
          ref={canvasRef}
          width={300}
          height={300}
          style={{ display: 'none' }}
        ></canvas>

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
    </>
  )
}
export default App