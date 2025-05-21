const selectCar = document.getElementById("select-car");
    const carButton = document.getElementById("car");
    const busButton = document.getElementById("bus");

    // Gán sự kiện click cho từng nút
    carButton.addEventListener("click", () => {
        selectCar.style.display = "none";
        // Thêm logic xử lý khi chọn Car (nếu cần)
    });

    busButton.addEventListener("click", () => {
        selectCar.style.display = "none";
        // Thêm logic xử lý khi chọn Bus (nếu cần)
    });