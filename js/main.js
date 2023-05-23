const burger = document.querySelector('.burger')
const container = document.querySelector('.container')
const links = document.querySelectorAll('.link');
const contentDiv = document.querySelector(' .content');
const screens = document.querySelectorAll('.screen');

burger.addEventListener('click', () => {
    container.classList.toggle('active')
})
