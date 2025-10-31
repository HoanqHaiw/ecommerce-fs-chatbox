import React from "react";
import "../scss/contact.scss";

const Contact = () => {
    return (
        <div className="contact-page container py-5">
            <h2 className="contact-title">Liên hệ với chúng tôi</h2>
            <p className="contact-desc">
                Nếu bạn có bất kỳ câu hỏi nào về sản phẩm hoặc dịch vụ, vui lòng liên hệ với chúng tôi qua biểu mẫu dưới đây hoặc ghé trực tiếp cửa hàng.
            </p>

            <div className="contact-content">
                {/* Cột trái: thông tin liên hệ */}
                <div className="contact-info">
                    <h4>Thông tin liên hệ</h4>
                    <p><strong>Địa chỉ:</strong> 41 Yên Nội, Quốc Oai, TP.HN</p>
                    <p><strong>Điện thoại:</strong> 0389816563</p>
                    <p><strong>Email:</strong> support@doantongoutlet.vn</p>
                    <p><strong>Giờ làm việc:</strong> Thứ 2 - CN, 8:00 - 21:00</p>
                </div>

                {/* Cột phải: form liên hệ */}
                <form className="contact-form">
                    <h4>Gửi tin nhắn cho chúng tôi</h4>
                    <div className="form-group">
                        <input type="text" placeholder="Họ và tên" required />
                    </div>
                    <div className="form-group">
                        <input type="email" placeholder="Email" required />
                    </div>
                    <div className="form-group">
                        <textarea rows="5" placeholder="Nội dung tin nhắn..." required></textarea>
                    </div>
                    <button type="submit" className="send-btn">Gửi liên hệ</button>
                </form>
            </div>

            {/* Bản đồ Google Map */}
            <div className="contact-map">
                <iframe
                    title="Google Map"
                    src="https://www.google.com/maps/embed?pb=!1m17!1m12!1m3!1d27552.725670348485!2d105.66015987388538!3d20.989939890079633!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m2!1m1!2s!5e1!3m2!1svi!2s!4v1761059024543!5m2!1svi!2s"
                    width="100%"
                    height="400"
                    style={{ border: 0 }}
                    allowFullScreen=""
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                ></iframe>
            </div>
        </div>
    );
};

export default Contact;
