window.addEventListener("load", () => {
    const filterBtn = document.getElementById("filter-btn");
    filterBtn.addEventListener("click", () => {
        const nameInputVal = document.getElementById("name-input").value.toLowerCase().trim();
        let products = document.getElementsByClassName("product");
        for(let product of products) {
            let nameVal = product.getElementsByClassName("nameval")[0].innerHTML.toLowerCase().trim();
            let cond1 =  nameVal.startsWith(nameInputVal); //de schimbat in .includes()
            let cond2;

            if(cond1 && cond2) product.style.display = block;
            else product.style.display = none;
        }
    });
});