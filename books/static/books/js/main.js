document.addEventListener('DOMContentLoaded', function() {
    // Инициализация каруселей для каждого жанра
    $('.fantasy-carousel').slick({
        slidesToShow: 5,
        slidesToScroll: 2,
        infinite: true,
        prevArrow: "<button type='button' class='slick-prev'>&#10094;</button>",
        nextArrow: "<button type='button' class='slick-next'>&#10095;</button>",
        responsive: [
            {
                breakpoint: 1024,
                settings: {
                    slidesToShow: 3,
                    slidesToScroll: 2
                }
            },
            {
                breakpoint: 768,
                settings: {
                    slidesToShow: 2,
                    slidesToScroll: 1
                }
            },
            {
                breakpoint: 480,
                settings: {
                    slidesToShow: 1,
                    slidesToScroll: 1
                }
            }
        ]
    });

    $('.detective-carousel').slick({
        slidesToShow: 5,
        slidesToScroll: 2,
        infinite: true,
        prevArrow: "<button type='button' class='slick-prev'>&#10094;</button>",
        nextArrow: "<button type='button' class='slick-next'>&#10095;</button>",
        responsive: [
            {
                breakpoint: 1024,
                settings: {
                    slidesToShow: 3,
                    slidesToScroll: 2
                }
            },
            {
                breakpoint: 768,
                settings: {
                    slidesToShow: 2,
                    slidesToScroll: 1
                }
            },
            {
                breakpoint: 480,
                settings: {
                    slidesToShow: 1,
                    slidesToScroll: 1
                }
            }
        ]
    });

    $('.manga-carousel').slick({
        slidesToShow: 5,
        slidesToScroll: 2,
        infinite: true,
        prevArrow: "<button type='button' class='slick-prev'>&#10094;</button>",
        nextArrow: "<button type='button' class='slick-next'>&#10095;</button>",
        responsive: [
            {
                breakpoint: 1024,
                settings: {
                    slidesToShow: 3,
                    slidesToScroll: 2
                }
            },
            {
                breakpoint: 768,
                settings: {
                    slidesToShow: 2,
                    slidesToScroll: 1
                }
            },
            {
                breakpoint: 480,
                settings: {
                    slidesToShow: 1,
                    slidesToScroll: 1
                }
            }
        ]
    });

    $('.romance-carousel').slick({
        slidesToShow: 5,
        slidesToScroll: 2,
        infinite: true,
        prevArrow: "<button type='button' class='slick-prev'>&#10094;</button>",
        nextArrow: "<button type='button' class='slick-next'>&#10095;</button>",
        responsive: [
            {
                breakpoint: 1024,
                settings: {
                    slidesToShow: 3,
                    slidesToScroll: 2
                }
            },
            {
                breakpoint: 768,
                settings: {
                    slidesToShow: 2,
                    slidesToScroll: 1
                }
            },
            {
                breakpoint: 480,
                settings: {
                    slidesToShow: 1,
                    slidesToScroll: 1
                }
            }
        ]
    });

    // Обработка поиска (если нужно)
    const searchInput = document.querySelector('.search-txt');
    if (searchInput) {
        searchInput.focus();
        searchInput.addEventListener('input', function() {
            if (searchInput.value !== '') {
                searchInput.style.color = 'white';
                searchInput.style.backgroundColor = '#1d1f21';
            } else {
                searchInput.style.color = '';
                searchInput.style.backgroundColor = '';
            }
        });
        setTimeout(function() {
            searchInput.focus();
        }, 100);
    }
});