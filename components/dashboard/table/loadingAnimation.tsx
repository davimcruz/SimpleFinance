import { useEffect, useRef } from "react"
import lottie from "lottie-web"

const LottieAnimation = ({ animationPath }: { animationPath: string }) => {
  const animationContainer = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    lottie.loadAnimation({
      container: animationContainer.current!,
      renderer: "svg",
      loop: true,
      autoplay: true,
      path: '/fill.json'
    })

    return () => {
      lottie.destroy() 
    }
  }, [animationPath])

  return (
    <div ref={animationContainer} style={{ width: 300, height: 300 }}></div>
  )
}

export default LottieAnimation
