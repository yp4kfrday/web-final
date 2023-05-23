let albums = [];
$(document).ready(function () {
    loadAlbumsFromLocalStorage()

    function loadAlbumsFromLocalStorage() {
        if (localStorage.getItem("albums")) {
            albums = JSON.parse(localStorage.getItem("albums"));
            artists = JSON.parse(localStorage.getItem("artists"));
            tracks = JSON.parse(localStorage.getItem("tracks"));
            populateArtistSelectOptions()
            displayAlbums(albums);
        } else {
            $.getJSON("../pages/Db.json", function (data) {
                albums = data.albums;
                artists = data.artist;
                tracks = data.tracks;
                saveAlbumsToLocalStorage();
                displayAlbums(albums);
            });
        }
    }
    
    function saveAlbumsToLocalStorage() {
        localStorage.setItem("albums", JSON.stringify(albums));
        localStorage.setItem("artists", JSON.stringify(artists));
    }
    

    function createAlbumsTableRow(album) {
        const { id, nameAlbum, releaseDate, artistNumber } = album;
        const artist = artists.find(artist => artist.id === artistNumber);
        const alias = artist ? artist.alias : '';
        return `
            <tr>
                <td>${id}</td>
                <td>${nameAlbum}</td>
                <td>${releaseDate}</td>
                <td>${artistNumber}</td>
                <td>
                    <button class="delete" data-id="${id}">Удалить</button>
                    <button class="edit" data-id="${id}">Редактировать</button>
                </td>
            </tr>`;
    }

    function populateArtistSelectOptions() {
        const selectElement = $("#artistNumber"); // Получаем элемент <select> по его идентификатору
    
        selectElement.empty(); // Очищаем элемент <select> перед заполнением новыми опциями
    
        // Проходим по массиву исполнителей и добавляем опции в элемент <select>
        artists.forEach(artist => {
            const option = `<option value="${artist.id}">${artist.alias}</option>`;
            selectElement.append(option);
        });
    }

    // Отображение данных в таблице
    function displayAlbums(albums) {
        const tableBody = $("tbody");
        tableBody.empty();

        albums.forEach((album) => {
        const newRow = createAlbumsTableRow(album);
        tableBody.append(newRow);
        });
    }

    $(".submit").click(function (event) {
        event.preventDefault();

        if ($(this).hasClass("update")) {
            return; // Просто выходим из обработчика, не выполняя никакого кода
        }

        // Проверка на пустые поля
        const inputs = ["#nameAlbum", "#releaseDate", "#artistNumber"];
        const values = inputs.map(input => $(input).val());


        if (values.some(value => !value)) {
            alert("Все поля должны быть заполнены!");
            return;
        }

        let id = albums.length > 0 ? Math.max(...albums.map(t => t.id)) + 1 : 1;
        // Добавление нового трека в массив

        const newAlbum = {
            id,
            nameAlbum: values[0],
            releaseDate: values[1],
            artistNumber: parseInt(values[2]),
        };
        albums.push(newAlbum);
        saveAlbumsToLocalStorage()

        // Создание новой строки и добавление ее в таблицу
        
        let newRow = createAlbumsTableRow(newAlbum);
        $("table").append(newRow);

        // Очистка формы
        $("form")[0].reset();
    });

    $(document).on("click", ".edit", function () {
        const row = $(this).closest("tr");
        const inputs = ["#id", "#nameAlbum", "#releaseDate", "#artistNumber"];
        const values = inputs.map(input => row.find(`td:eq(${inputs.indexOf(input)})`).text());
        inputs.forEach((input, index) => $(input).val(values[index]));

        // Изменение логики кнопки "Отправить" на логику "Изменить"
        $(".submit").removeClass("submit").addClass("update").text("Изменить");
    });

    let cancelTimeout;

    function createCancelButton(id, nameAlbum, releaseDate, artistNumber) {
        let cancelButton = $("<button/>", {
            text: "Отмена",
            class: "cancel",
            click: function () {
                $("#id").val(id);
                $("#nameAlbum").val(nameAlbum);
                $("#releaseDate").val(releaseDate);
                $("#artistNumber").val(artistNumber);

                $(this).remove();

                // Активируем кнопку обновления
                $(".update").removeClass("disabled");

                clearTimeout(cancelTimeout);

                $(".submit").removeClass("submit").addClass("update").text("Обновить");
            },
        });

        return cancelButton;
    }

    $(document).on("click", ".update", function (event) {
        event.preventDefault();

        // Проверяем, есть ли активный режим обновления
        if ($(this).hasClass("disabled")) {
            return;
        }

        let id = $("#id").val();
        let nameAlbum = $("#nameAlbum").val();
        let releaseDate = $("#releaseDate").val();
        let artistNumber = Number($("#artistNumber").val());

        let index = albums.findIndex(function (album) {
            return album.id == id;
        });

        if (index === -1) {
            alert("Артист с указанным ID не найден!");
            return;
        }

        // Деактивируем кнопку обновления
        $(this).addClass("disabled");
        $(".cancel").show();

        const album = albums[index];
        album.nameAlbum = nameAlbum;
        album.releaseDate = releaseDate;
        album.artistNumber = artistNumber;

        saveAlbumsToLocalStorage()

        const row = $("table tr").eq(index + 1);
        row.find("td:eq(1)").text(nameAlbum);
        row.find("td:eq(2)").text(releaseDate);
        row.find("td:eq(3)").text(artistNumber);

        const cancelButton = createCancelButton(id, nameAlbum, releaseDate, artistNumber);

        $(this).after(cancelButton);

        $("form")[0].reset();

        cancelTimeout = setTimeout(function () {
            cancelButton.remove();
            $(".update").removeClass("disabled")
                .removeClass("update")
                .addClass("submit")
                .text("Отправить");
        }, 3000);
    });

    $(document).on("click", ".delete", function () {
        const id = $(this).data("id");

         // Получение данных треков из localStorage
        const tracksData = JSON.parse(localStorage.getItem("tracks"));

        // Проверка наличия альбомов с треками
        const hasAlbumsWithTracks = tracksData.some(track => track.albumNumber === parseInt(id));

        if (hasAlbumsWithTracks) {
            alert("Невозможно удалить артиста, так как у него есть альбомы с треками.");
            return;
        }

        if (confirm("Вы действительно хотите удалить запись?")) {
            $(this).closest("tr").remove();
            albums = albums.filter((el) => el.id !== id);

            // Обновление ID всех оставшихся артистов
            for (let i = 0; i < albums.length; i++) {
                albums[i].id = i + 1;
            }

            saveAlbumsToLocalStorage()
        }
    });

});