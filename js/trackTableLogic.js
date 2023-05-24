
$(document).ready(function () {
    loadTracksFromLocalStorage()

    function loadTracksFromLocalStorage() {
        if (localStorage.getItem("tracks")) {
            tracks = JSON.parse(localStorage.getItem("tracks"));
            albums = JSON.parse(localStorage.getItem("albums"));
            populateAlbumSelectOptions()
            displayTracks(tracks);
        } else {
            $.getJSON("../pages/Db.json", function (data) {
                tracks = data.tracks;
                albums = data.albums;
                displayTracks(tracks);
                saveTracksToLocalStorage()
            });
        }
    }

    function saveTracksToLocalStorage() {
        localStorage.setItem("tracks", JSON.stringify(tracks));
        localStorage.setItem("albums", JSON.stringify(albums));
    }

    function createTableRow(track) {
        const { id, name, duration, albumNumber, feat } = track;
        const album = albums.find(album => album.id === albumNumber);
        
        return `
            <tr>
                <td>${id}</td>
                <td>${name}</td>
                <td>${duration}</td>
                <td>${albumNumber}</td>
                <td>${feat}</td>
                <td>
                    <button class="delete" data-id="${id}">Удалить</button>
                    <button class="edit" data-id="${id}">Редактировать</button>
                </td>
            </tr>`;
    }

    function populateAlbumSelectOptions() {
        const selectElement = $("#albumNumber"); // Получаем элемент <select> по его идентификатору
    
        selectElement.empty(); // Очищаем элемент <select> перед заполнением новыми опциями
    
        // Проходим по массиву исполнителей и добавляем опции в элемент <select>
        albums.forEach(album => {
            const option = `<option value="${album.id}">${album.nameAlbum}</option>`;
            selectElement.append(option);
        });
    }

    // Отображение данных в таблице
    function displayTracks(tracks) {
        const tableBody = $("tbody");
        tableBody.empty();
        tracks.forEach((track) => {
            const newRow = createTableRow(track);
            tableBody.append(newRow);
        });
    }

    $(".submit").click(function (event) {
        event.preventDefault();

        if ($(this).hasClass("update")) {
            return; // Просто выходим из обработчика, не выполняя никакого кода
        }

        // Проверка на пустые поля
        const inputs = ["#name", "#duration", "#albumNumber", "#feat"];
        const values = inputs.map(input => $(input).val());


        if (values.some(value => !value)) {
            alert("Все поля должны быть заполнены!");
            return;
        }

        let id = tracks.length > 0 ? Math.max(...tracks.map(t => t.id)) + 1 : 1;
        // Добавление нового трека в массив
        const newTrack = {
            id,
            name: values[0],
            duration: values[1],
            albumNumber:  parseInt(values[2]),
            feat: values[3]
        };
        tracks.push(newTrack);
        
        saveTracksToLocalStorage() 

        // Создание новой строки и добавление ее в таблицу
        let newRow = createTableRow(newTrack);
        $("table").append(newRow);

        // Очистка формы
        $("form")[0].reset();
    });

    $(document).on("click", ".edit", function () {
        const row = $(this).closest("tr");
        const inputs = ["#id", "#name", "#duration", "#albumNumber", "#feat"];
        const values = inputs.map(input => row.find(`td:eq(${inputs.indexOf(input)})`).text());
        inputs.forEach((input, index) => $(input).val(values[index]));

        // Изменение логики кнопки "Отправить" на логику "Изменить"
        $(".submit").removeClass("submit").addClass("update").text("Изменить");
    });

    let cancelTimeout;

    function createCancelButton(id, name, duration, albumNumber, feat) {
        let cancelButton = $("<button/>", {
            text: "Отмена",
            class: "cancel",
            click: function () {
                $("#id").val(id);
                $("#name").val(name);
                $("#duration").val(duration);
                $("#albumNumber").val(albumNumber);
                $("#feat").val(feat);

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
        let name = $("#name").val();
        let duration = $("#duration").val();
        let albumNumber = Number($("#albumNumber").val());
        let feat = $("#feat").val();



        let index = tracks.findIndex(function (track) {
            return track.id == id;
        });

        if (index === -1) {
            alert("Трек с указанным ID не найден!");
            return;
        }

        // Деактивируем кнопку обновления
        $(this).addClass("disabled");
        $(".cancel").show();

        const track = tracks[index];
        track.name = name;
        track.duration = duration;
        track.albumNumber = albumNumber;
        track.feat = feat;

        saveTracksToLocalStorage() 

        const row = $("table tr").eq(index + 1);
        row.find("td:eq(1)").text(name);
        row.find("td:eq(2)").text(duration);
        row.find("td:eq(3)").text(albumNumber);
        row.find("td:eq(4)").text(feat);

        const cancelButton = createCancelButton(id, name, duration, albumNumber, feat);

        $(this).after(cancelButton);

        $("form")[0].reset();

        cancelTimeout = setTimeout(function () {
            cancelButton.remove();
            $(".update").removeClass("disabled")
                .removeClass("update")
                .addClass("submit")
                .text("Отправить");
        }, 2000);
    });

    $(document).on("click", ".delete", function () {
        const id = $(this).data("id");
        if (confirm("Вы действительно хотите удалить запись?")) {
            $(this).closest("tr").remove();
            tracks = tracks.filter((el) => el.id !== id);

            // Обновление ID всех оставшихся треков
            for (let i = 0; i < tracks.length; i++) {
                tracks[i].id = i + 1;
            }

            saveTracksToLocalStorage() 
        }
    });
    
});