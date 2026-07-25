document.addEventListener("DOMContentLoaded", () => {
    // 1. Xử lý sự kiện khi bấm nút Đăng nhập với Google / Login
    const loginBtn = document.querySelector("#loginBtn, .login-btn, button"); 
    if (loginBtn) {
        loginBtn.addEventListener("click", (e) => {
            e.preventDefault();
            
            // Lấy tên người dùng nếu có ô nhập, nếu không tự đặt tên mặc định
            const usernameInput = document.getElementById("username");
            const username = usernameInput ? usernameInput.value : "Người chơi Cloud";

            const payload = {
                user_id: "user_" + Math.floor(Math.random() * 10000),
                username: username,
                device_type: navigator.userAgent.includes("Mobile") ? "Mobile Device" : "PC / Desktop"
            };

            // Gửi dữ liệu đăng nhập lên Server Flask
            fetch('/api/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            })
            .then(res => res.json())
            .then(data => {
                if (data.status === "success") {
                    console.log("Đăng nhập thành công lên Server!", data.user);
                    alert("Đăng nhập thành công vào hệ thống Cloud Gaming!");
                    // Bạn có thể chuyển hướng trang hoặc ẩn form đăng nhập tại đây nếu muốn
                }
            })
            .catch(err => console.error("Lỗi kết nối API đăng nhập:", err));
        });
    }

    
});