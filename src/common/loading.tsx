import './loading.css'

export default function Loading() {
  return (
    <div className="absolute z-20 inset-0 bg-[rgba(0,0,0,0.35)] flex items-center justify-center">
      <div className="wrapper">
        <div className="circle"></div>
        <div className="circle"></div>
        <div className="circle"></div>
        <div className="shadow"></div>
        <div className="shadow"></div>
        <div className="shadow"></div>
      </div>
    </div>
  );
}
