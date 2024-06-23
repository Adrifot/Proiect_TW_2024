// window.addEventListener("load", () => {
//     const prods = document.getElementsByClassName("prodcard");
//     for (let i = 0; i < prods.length; i++) {
//         setTimeout(() => {
//             prods[i].style.display = 'block';
//             prods[i].style.opacity = 1;
//         }, i * 1000); 
//     }
// });

window.addEventListener("load", () => {
    const prods = document.getElementsByClassName("prodcard");
    let currentIndex = 0;
    const displayTime = 5000;

    function showProduct(index) {
      
      for (let i = 0; i < prods.length; i++) {
        prods[i].style.display = 'none';
        prods[i].style.opacity = 0;
        prods[i].style.transform = 'scale(0.95)';
      }
      
      prods[index].style.display = 'block';
      setTimeout(() => {
        prods[index].style.opacity = 1;
        prods[index].style.transform = 'scale(1)';
      }, 50); 
    }

    function nextProduct() {
      showProduct(currentIndex);
      currentIndex = (currentIndex + 1) % prods.length;
    }

    
    showProduct(currentIndex);

    setInterval(nextProduct, displayTime + 1000); 
  });