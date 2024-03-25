window.addEventListener('resize', dynamicallySizeHighlight);

$(function () {
    dynamicallySizeHighlight();
 });

function dynamicallySizeHighlight(){
    if(window.innerWidth > 991) {
        $("#highlight_image").height($("#welcome_text p").height());
    } else{
        $("#highlight_image").height('auto');
    }
}