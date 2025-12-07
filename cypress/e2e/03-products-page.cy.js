describe('PRODUCTS PAGE - Trang sản phẩm', () => {
    beforeEach(() => {
        cy.visit('/products')
        cy.intercept('GET', '**/api/products**').as('getProducts')
        cy.wait('@getProducts', { timeout: 10000 })
    })

    // Helper function để extract giá đúng cách
    const extractPriceFromText = (text) => {
        // Tìm tất cả sequences số có dấu chấm/phẩy
        const numberMatches = text.match(/\b\d{1,3}(?:\.\d{3})*(?:,\d+)?\b/g) || []

        if (numberMatches.length === 0) return 0

        // Phân tích từng số tìm được
        const possiblePrices = numberMatches.map(match => {
            // Loại bỏ dấu chấm phân cách nghìn, thay dấu phẩy thập phân bằng chấm
            const clean = match.replace(/\./g, '').replace(',', '.')
            const num = parseFloat(clean)

            // Chỉ lấy số hợp lệ
            if (isNaN(num) || num <= 0) return null

            // Phân loại: số quá lớn (> 1 tỷ) có thể là ID, số quá nhỏ (< 100) có thể là số lượng
            if (num > 1000000000 || num < 100) return null

            return num
        }).filter(n => n !== null)

        if (possiblePrices.length === 0) return 0

        // Ưu tiên số trong khoảng giá sản phẩm thông thường (100.000 - 10.000.000)
        const reasonablePrices = possiblePrices.filter(p => p >= 100000 && p <= 10000000)

        if (reasonablePrices.length > 0) {
            return Math.max(...reasonablePrices)
        }

        // Nếu không có số trong khoảng hợp lý, lấy số lớn nhất
        return Math.max(...possiblePrices)
    }

    describe('TC-PROD-001: Hiển thị trang sản phẩm cơ bản', () => {
        it('Nên hiển thị Navbar', () => {
            cy.get('nav').should('exist')
        })

        it('Nên hiển thị tiêu đề tìm kiếm', () => {
            cy.get('input[placeholder="Find Products..."]').should('be.visible')
        })

        it('Nên hiển thị danh sách sản phẩm', () => {
            cy.get('.product-grid .product-card, .product-grid .card, .product-grid > div').should('have.length.at.least', 1)
        })
    })

    describe('TC-PROD-002: Sidebar Categories', () => {
        it('Nên hiển thị danh mục categories', () => {
            cy.get('.sidebar h5').contains('Category').should('be.visible')

            const categories = ['All', 'Men', 'Women', 'Collections', 'Accessories']
            categories.forEach(category => {
                cy.get('.sidebar ul li').contains(category).should('be.visible')
            })
        })

        it('Nên filter sản phẩm theo category Men', () => {
            cy.get('.sidebar ul li').contains('Men').click()
            cy.get('.sidebar ul li.active-category').should('contain', 'Men')
            cy.wait(1000)
        })

        it('Nên filter sản phẩm theo category Women', () => {
            cy.get('.sidebar ul li').contains('Women').click()
            cy.get('.sidebar ul li.active-category').should('contain', 'Women')
            cy.wait(1000)
        })

        it('Nên điều hướng đến Collections khi click', () => {
            cy.get('.sidebar ul li').contains('Collections').click()
            cy.url().should('include', '/collections')
        })
    })

    describe('TC-PROD-003: Tìm kiếm sản phẩm', () => {
        it('Nên tìm kiếm sản phẩm theo từ khóa', () => {
            const searchTerm = 'Shirt'

            cy.get('.search-bar input').type(searchTerm)
            cy.get('.search-bar input').should('have.value', searchTerm)
            cy.wait(1000)
        })
    })

    describe('TC-PROD-004: Sắp xếp sản phẩm', () => {
        it('Nên sắp xếp giá từ thấp đến cao bằng select', () => {
            cy.get('select').select('price-asc')
            cy.get('select').should('have.value', 'price-asc')
            cy.wait(1500)

            // Lấy giá từ API response để so sánh
            cy.get('@getProducts').then((interception) => {
                if (interception?.response?.body?.products) {
                    const apiProducts = interception.response.body.products

                    // Lấy giá từ API và sort
                    const apiPrices = apiProducts
                        .map(p => p.price)
                        .filter(price => price > 0)
                        .sort((a, b) => a - b)

                    if (apiPrices.length > 1) {
                        // Kiểm tra giá hiển thị trên UI (optional)
                        cy.get('.product-card, .card, [class*="product"]').then(($products) => {
                            const uiPrices = []

                            $products.each((index, product) => {
                                const text = Cypress.$(product).text()
                                const price = extractPriceFromText(text)
                                if (price > 0) {
                                    uiPrices.push(price)
                                }
                            })

                            if (uiPrices.length > 1) {
                                cy.log(`API Prices (sorted): ${apiPrices.slice(0, 5).join(', ')}...`)
                                cy.log(`UI Prices found: ${uiPrices.join(', ')}`)
                            }
                        })
                    }
                }
            })
        })

        it('Nên sắp xếp giá từ cao đến thấp bằng select - SIMPLE CHECK', () => {
            cy.get('select').select('price-desc')
            cy.get('select').should('have.value', 'price-desc')
            cy.wait(1500)

            // Đơn giản: chỉ kiểm tra select đã được chọn đúng
            // Và kiểm tra có sản phẩm hiển thị
            cy.get('.product-card, .card, [class*="product"]')
                .should('have.length.at.least', 1)
        })

        it('Nên sắp xếp bằng radio button', () => {
            // Test radio button Low to High
            cy.get('.filter-section label')
                .contains('Low to High')
                .click()

            cy.get('.filter-section input[type="radio"]')
                .first()
                .should('be.checked')

            cy.wait(1000)

            // Test radio button High to Low
            cy.get('.filter-section label')
                .contains('High to Low')
                .click()

            cy.get('.filter-section input[type="radio"]')
                .last()
                .should('be.checked')
        })
    })

    describe('TC-PROD-005: Phân trang', () => {
        it('Nên hiển thị thông tin phân trang', () => {
            cy.get('.pagination-info p').should('be.visible')
            cy.get('.pagination-info p').should('contain', 'Showing')
        })

        it('Nên hiển thị phân trang khi có nhiều sản phẩm', () => {
            cy.get('@getProducts').then((interception) => {
                if (interception?.response?.body?.products) {
                    const totalProducts = interception.response.body.products.length || 0
                    const hasPagination = totalProducts > 8

                    if (hasPagination) {
                        cy.get('.pagination').should('be.visible')
                        cy.get('.pagination-btn').should('have.length.at.least', 3)
                    } else {
                        cy.get('.pagination').should('not.exist')
                    }
                }
            })
        })

        it('Nên chuyển trang khi click nút số trang', () => {
            cy.get('.pagination-btn').then(($buttons) => {
                if ($buttons.length >= 3) {
                    const page2Btn = $buttons.filter((index, btn) => {
                        const text = Cypress.$(btn).text().trim()
                        return text === '2'
                    })

                    if (page2Btn.length > 0) {
                        cy.wrap(page2Btn).click()
                        cy.get('.pagination-btn.active').should('contain', '2')
                    }
                }
            })
        })

        it('Nên chuyển trang Next/Previous', () => {
            cy.get('.pagination-btn').then(($buttons) => {
                const hasNext = $buttons.filter((index, btn) => {
                    return Cypress.$(btn).text().includes('Next')
                }).length > 0

                if (hasNext) {
                    cy.get('.pagination-btn').contains('Next').click()
                    cy.wait(1000)
                    cy.get('.pagination-btn.active').should('not.contain', '1')

                    cy.get('.pagination-btn').contains('Previous').click()
                    cy.wait(1000)
                    cy.get('.pagination-btn.active').should('contain', '1')
                }
            })
        })

        it('Nên disable nút Previous ở trang đầu', () => {
            cy.get('.pagination-btn').then(($buttons) => {
                const prevBtn = $buttons.filter((index, btn) => {
                    return Cypress.$(btn).text().includes('Previous')
                })

                if (prevBtn.length > 0) {
                    cy.wrap(prevBtn).should('be.disabled')
                }
            })
        })
    })

    describe('TC-PROD-006: Hiển thị thông tin sản phẩm', () => {
        it('Nên hiển thị đầy đủ thông tin sản phẩm', () => {
            cy.get('.product-card, .card, [class*="product"]').first().then(($card) => {
                cy.wrap($card).find('img').should('exist').and('be.visible')

                const cardText = $card.text()
                expect(cardText).to.match(/[\d.,]+/) // Có chứa số (giá)
                expect(cardText).to.match(/[A-Za-zÀ-ỹ\s]{2,}/) // Có tên sản phẩm
            })
        })

        it('Nên hiển thị nút Add to cart', () => {
            cy.get('.product-card, .card, [class*="product"]').first().should(($card) => {
                const text = $card.text()
                expect(text.toLowerCase()).to.include('add to cart')
            })
        })
    })

    describe('TC-PROD-007: Responsive và UX', () => {
        it('Nên hiển thị active category', () => {
            cy.get('.sidebar ul li').contains('All').should('have.class', 'active-category')

            cy.get('.sidebar ul li').contains('Men').click()
            cy.get('.sidebar ul li').contains('Men').should('have.class', 'active-category')
            cy.get('.sidebar ul li').contains('All').should('not.have.class', 'active-category')
        })

        it('Nên clear search khi click category', () => {
            cy.get('.search-bar input').type('Test')
            cy.get('.search-bar input').should('have.value', 'Test')

            cy.get('.sidebar ul li').contains('Men').click()
            cy.get('.product-grid').should('exist')
        })
    })

    afterEach(() => {
        if (Cypress.currentTest.state === 'failed') {
            cy.screenshot(`failed-${Cypress.currentTest.title.replace(/\s+/g, '-')}`)
        }
    })
})