$(document).ready(function () {

    loadArtistsFromLocalStorage();

    function loadArtistsFromLocalStorage() {
        if (localStorage.getItem("artists")) {
            artists = JSON.parse(localStorage.getItem("artists"));
            albums = JSON.parse(localStorage.getItem("albums"));
            displayArtists(artists);
        } else {
            $.getJSON("../pages/Db.json", function (data) {
                artists = data.artists;
                albums = data.albums;
                displayArtists(artists);
                saveArtistsToLocalStorage()
            });
        }
    }

    function saveArtistsToLocalStorage() {
        localStorage.setItem("artists", JSON.stringify(artists));
    }
    

    function createArtistTableRow(artist) {
        const { id, alias, fullName, dateOfBirth } = artist;
        return `
            <tr>
            <td>${id}</td>
            <td>${alias}</td>
            <td>${fullName}</td>
            <td>${dateOfBirth}</td>
                <td>
                    <button class="delete" data-id="${id}">Удалить</button>
                    <button class="edit" data-id="${id}">Редактировать</button>
                </td>
            </tr>`;
    }

    // Отображение данных в таблице
    function displayArtists(artists) {
        const tableBody = $("tbody");
        tableBody.empty();

        artists.forEach((artist) => {
        const newRow = createArtistTableRow(artist);
        tableBody.append(newRow);
        });
    }

    $(".submit").click(function (event) {
        event.preventDefault();

        if ($(this).hasClass("update")) {
            return; // Просто выходим из обработчика, не выполняя никакого кода
        }

        // Проверка на пустые поля
        const inputs = ["#alias", "#fullName", "#dateOfBirth"];
        const values = inputs.map(input => $(input).val());


        if (values.some(value => !value)) {
            alert("Все поля должны быть заполнены!");
            return;
        }

        let id = artists.length > 0 ? Math.max(...artists.map(t => t.id)) + 1 : 1;
        // Добавление нового трека в массив
        const newArtist = {
            id,
            alias: values[0],
            fullName: values[1],
            dateOfBirth: values[2],
        };
        artists.push(newArtist);
        saveArtistsToLocalStorage();

        // Создание новой строки и добавление ее в таблицу
        let newRow = createArtistTableRow(newArtist);
        $("table").append(newRow);

        // Очистка формы
        $("form")[0].reset();
    });

    $(document).on("click", ".edit", function () {
        const row = $(this).closest("tr");
        const inputs = ["#id", "#alias", "#fullName", "#dateOfBirth"];
        const values = inputs.map(input => row.find(`td:eq(${inputs.indexOf(input)})`).text());
        inputs.forEach((input, index) => $(input).val(values[index]));

        // Изменение логики кнопки "Отправить" на логику "Изменить"
        $(".submit").removeClass("submit").addClass("update").text("Изменить");
    });

    let cancelTimeout;

    function createCancelButton(id, alias, fullName, dateOfBirth) {
        let cancelButton = $("<button/>", {
            text: "Отмена",
            class: "cancel",
            click: function () {
                $("#id").val(id);
                $("#alias").val(alias);
                $("#fullName").val(fullName);
                $("#dateOfBirth").val(dateOfBirth);

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
        let alias = $("#alias").val();
        let fullName = $("#fullName").val();
        let dateOfBirth = $("#dateOfBirth").val();

        let index = artists.findIndex(function (artist) {
            return artist.id == id;
        });

        if (index === -1) {
            alert("Артист с указанным ID не найден!");
            return;
        }

        // Деактивируем кнопку обновления
        $(this).addClass("disabled");
        $(".cancel").show();

        const artist = artists[index];
        artist.alias = alias;
        artist.fullName = fullName;
        artist.dateOfBirth = dateOfBirth;

        saveArtistsToLocalStorage();

        const row = $("table tr").eq(index + 1);
        row.find("td:eq(1)").text(alias);
        row.find("td:eq(2)").text(fullName);
        row.find("td:eq(3)").text(dateOfBirth);

        const cancelButton = createCancelButton(id, alias, fullName, dateOfBirth);

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
    
        // Получение данных альбомов из localStorage
        const albumsData = JSON.parse(localStorage.getItem("albums"));
    
        // Проверка наличия альбомов с треками
        const hasAlbumsWithTracks = albumsData.some(album => album.artistNumber === parseInt(id));
    
        if (hasAlbumsWithTracks) {
            alert("Невозможно удалить артиста, так как у него есть альбомы с треками.");
            return;
        }
    
        if (confirm("Вы действительно хотите удалить запись?")) {
            $(this).closest("tr").remove();
            artists = artists.filter((el) => el.id !== id);
    
            // Обновление ID всех оставшихся артистов
            for (let i = 0; i < artists.length; i++) {
                artists[i].id = i + 1;
            }
    
            saveArtistsToLocalStorage();
        }
    });
    
}); 