// 功能描述：开发时直接使用figma设计图给定的px值，不需要在费劲的调整
// 320 默认大小16px; 320px = 20rem ;每个元素px基础上/16

import { ref } from "vue";

const REM_TYPE = 1 // 0: objectFit[contain]模式;   1：width模式;
const OPENSCALE = false // 是否开启浏览器缩放
// 配置项, 用来配置不同设备设计图的宽高
const config = [
    {
        width: 1920,
        height: 1080,
        device: '电脑',
        deviceMinWidth: 0, // 设备最小宽度，否则换成手机模式，按顺序生效
        fontScale: 1,
    },
    // {
    //     width: 600,
    //     height: 844,
    //     device: '手机',
    //     deviceMinWidth: 0, // 设备最小宽度，否则换成手机模式，按顺序生效
    //     // fontScale: 1.03
    //     fontScale: 1
    // },
];

// ------------------配置结束------------------

const figmaIdxRef = ref(0);
let idx_last = -1
// 选择第几个设计图，判断设备类型的逻辑
const idx = () => {
    let idref = -1;
    config.forEach((item, index) => {
        if(idref===-1){
            if(window.innerWidth>item.deviceMinWidth){
                idref = index
            }
        }
    })
    figmaIdxRef.value = idref
    return figmaIdxRef.value;
};
function setRem() {
    const htmlWidth =
        document.documentElement.clientWidth || document.body.clientWidth;
    // 高度
    const htmlHeight =
        document.documentElement.clientHeight || document.body.clientHeight;
    // 计算页面比例
    const domScale = htmlWidth / htmlHeight;
    // 打印上述所有变量
    // console.log("htmlWidth", htmlWidth);
    // console.log("htmlHeight", htmlHeight);
    // console.log("domScale", domScale);

    // 计算对应设计图比例
    const I = idx()
    if(I!==idx_last && idx_last!==-1){
        // confirm 不需要注释即可
        // alert(`页面即将切换为${config[I].device}视图,即将刷新页面`)
        // location.reload();
        
    }
    idx_last = I
    const whichFigma = config[I];
    const figmaScale = whichFigma.width / whichFigma.height;

    const htmlDom = document.getElementsByTagName("html")[0];

    // 如果页面比例比设计图宽（相对更宽屏）
    if (domScale >= figmaScale) {
        // 初始fontsize为16px
        // 那么页面高度除以设计图高度，作为页面的缩放比例来计算字体大小计算htmlDom.style.fontSize
        htmlDom.style.fontSize = (OPENSCALE ? window.devicePixelRatio : 1) * (16 * htmlHeight) / (whichFigma.height/whichFigma.fontScale) + "px";
    } else {
        // 如果页面比例比设计图窄（相对更窄屏）
        // 初始fontsize为16px
        // 那么页面宽度除以设计图宽度，作为页面的缩放比例来计算字体大小计算htmlDom.style.fontSize
        htmlDom.style.fontSize = (OPENSCALE ? window.devicePixelRatio : 1) * (16 * htmlWidth) / (whichFigma.width/whichFigma.fontScale) + "px";
    }
}
function setRem1() {
    const htmlWidth =
        document.documentElement.clientWidth || document.body.clientWidth;
    // 高度
    const htmlHeight =
        document.documentElement.clientHeight || document.body.clientHeight;
    // 计算页面比例

    // 计算对应设计图比例
    const I = idx()
    if(I!==idx_last && idx_last!==-1){
        // confirm 不需要注释即可
        // alert(`页面即将切换为${config[I].device}视图,即将刷新页面`)
        // location.reload();
    }
    idx_last = I
    const whichFigma = config[I];
    const htmlDom = document.getElementsByTagName("html")[0];
    htmlDom.style.fontSize = (OPENSCALE ? window.devicePixelRatio : 1) * (16 * htmlWidth) / (whichFigma.width/whichFigma.fontScale) + "px";
}

function setup(){
    if(REM_TYPE === 0 as number){
        setRem();
    }else if(REM_TYPE === 1){
        setRem1();
    }
}
// 初始化
setup();
// 改变窗口大小时重新设置 rem
window.addEventListener("resize", function () {
    setup();
});

// 导出figmaIdxRef
export default figmaIdxRef;
