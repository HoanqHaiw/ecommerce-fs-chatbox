/// <reference types="cypress" />

describe('Trang Chủ (Home Page) E2E Tests', () => {

    const BASE_URL_API = 'http://localhost:5000';
    // PHẢI khớp với BASE_URL trong component React

    beforeEach(() => {
        // 1. Chặn (Intercept) yêu cầu API
        // Khi component gọi GET /api/products, hãy trả về dữ liệu từ fixture
        cy.intercept('GET', `${BASE_URL_API}/api/products`, {
            statusCode: 200,
            fixture: 'products.json' // Sử dụng dữ liệu giả lập đã tạo ở Bước 1
        }).as('getProducts'); // Đặt tên alias là @getProducts

        // 2. Truy cập trang (Giả sử trang Home là đường dẫn '/')
        cy.visit('/');

        // 3. Đảm bảo API đã được gọi và hoàn thành trước khi test
        cy.wait('@getProducts');
    });

    // ----------------------------------------------------

    it('1. Hiển thị Banner và Tiêu đề "Hot Products"', () => {
        // Xác nhận các banner hiển thị
        cy.get('.banner-full img').should('have.length', 2).and('be.visible');

        // Xác nhận tiêu đề sản phẩm nổi bật hiển thị
        cy.contains('h2', 'Hot Products').should('be.visible');
    });

    // ----------------------------------------------------

    it('2. Load đúng 4 sản phẩm đầu tiên từ API', () => {
        // products.slice(currentIndex, currentIndex + itemsPerPage) sẽ hiển thị 4 sản phẩm đầu tiên (p1 đến p4)

        cy.get('.row-cols-md-4 .col')
            .should('have.length', 4) // Phải có 4 cột sản phẩm hiển thị

        // Xác nhận tên sản phẩm đầu tiên hiển thị đúng
        cy.get('.card-title').first().should('contain', 'Sản phẩm 1 - Mới nhất');

        // Xác nhận giá sản phẩm đầu tiên hiển thị đúng
        // Giá 120000đ được format thành "120.000đ"
        cy.get('.text-primary.fw-bold').first().should('contain', '120.000đ');

        // Xác nhận link sản phẩm đầu tiên dẫn đến trang chi tiết đúng
        cy.get('a[href^="/products/"]').first()
            .should('have.attr', 'href', '/products/p1'); // Kiểm tra link đúng id
    });

    // ----------------------------------------------------

    it('3. Tự động chuyển nhóm sản phẩm sau 5 giây (Auto-slide)', () => {
        // Cypress cho phép kiểm tra thời gian bằng cách thay thế hàm setTimeout/setInterval

        // Tên sản phẩm ban đầu (Nhóm 1)
        cy.get('.card-title').first().should('contain', 'Sản phẩm 1 - Mới nhất');

        // Tăng thời gian giả lập lên 5001ms (lớn hơn 5000ms trong useEffect)
        cy.tick(5001);

        // Tên sản phẩm sau khi chuyển (Nhóm 2: p5, p6, và 2 sản phẩm tiếp theo, nhưng vì chỉ có 6 sản phẩm, nên sẽ là p5, p6 và 2 phần tử trống hoặc không hiển thị)
        // Trong trường hợp này, vì chỉ có 6 sản phẩm, nhóm thứ 2 sẽ là p5 và p6, sau đó index sẽ reset

        // Kiểm tra sản phẩm đầu tiên trong nhóm mới (p5)
        cy.get('.card-title').first().should('contain', 'Sản phẩm 5 - Nhóm sau');

        // Tăng thời gian lần nữa (5001 + 5001 = 10002ms)
        cy.tick(5001);

        // Index sẽ quay về 0, hiển thị lại Sản phẩm 1
        cy.get('.card-title').first().should('contain', 'Sản phẩm 1 - Mới nhất');
    });

});