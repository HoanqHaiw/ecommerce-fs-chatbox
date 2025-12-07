describe('AUTHENTICATION - ĐĂNG KÝ & ĐĂNG NHẬP', () => {
    const testUser = {
        username: 'testuser_' + Date.now(),
        email: `test${Date.now()}@example.com`,
        password: 'Password123!',
        phone: '0912345678'
    }

    beforeEach(() => {
        cy.clearLocalStorage()
    })

    it('TC-REG-001: Đăng ký thành công (không có xác nhận mật khẩu)', () => {
        cy.visit('/register')


        cy.get('input[placeholder="Tên đăng nhập"]').type(testUser.username)
        cy.get('input[placeholder="Email"]').type(testUser.email)
        cy.get('input[placeholder="Mật khẩu"]').type(testUser.password)
        cy.get('input[placeholder="Số điện thoại"]').type(testUser.phone)

        cy.get('button').contains('Tạo tài khoản').click()


        cy.url().should('include', '/login')
    })

    it('TC-LOGIN-001: Đăng nhập thành công', () => {

        const newUser = {
            username: 'loginuser_' + Date.now(),
            email: `login${Date.now()}@example.com`,
            password: '123456',
            phone: '0911111111'
        }

        cy.visit('/register')
        cy.get('input[placeholder="Tên đăng nhập"]').type(newUser.username)
        cy.get('input[placeholder="Email"]').type(newUser.email)
        cy.get('input[placeholder="Mật khẩu"]').type(newUser.password)
        cy.get('input[placeholder="Số điện thoại"]').type(newUser.phone)
        cy.get('button').contains('Tạo tài khoản').click()


        cy.visit('/login')
        cy.get('input[placeholder="Email"]').type(newUser.email)
        cy.get('input[placeholder="Mật khẩu"]').type(newUser.password)
        cy.get('button').contains('Đăng nhập').click()

        cy.url().should('not.include', '/login')

        cy.window().then((win) => {
            expect(win.localStorage.getItem('userToken')).to.exist
        })


        cy.get('body').should('exist')
    })

    it('TC-LOGIN-002: Đăng nhập thất bại - Sai mật khẩu', () => {
        cy.visit('/login')

        cy.get('input[placeholder="Email"]').type('wrong@example.com')
        cy.get('input[placeholder="Mật khẩu"]').type('wrongpassword')
        cy.get('button').contains('Đăng nhập').click()


        cy.url().should('include', '/login')
    })

    it('TC-NAV-001: Chuyển hướng giữa Login và Register', () => {
        cy.visit('/login')
        cy.get('button').contains('Đăng ký').click()
        cy.url().should('include', '/register')

        cy.get('button').contains('Quay lại đăng nhập').click()
        cy.url().should('include', '/login')
    })
})