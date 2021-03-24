import onChange from 'on-change';
import notFound from '../images/404.jpeg';

export default () => {
  const pathApi = 'https://api.themoviedb.org/3/search/movie';
  const urlPathApi = new URL(pathApi);
  const pathImage = 'http://image.tmdb.org/t/p/w185';
  const imgNotFound = notFound;
  urlPathApi.searchParams.append('api_key', '6b363d9bdcf3ef8d9625ef0c566f1ba5');

  const searchInput = document.querySelector('.form-search__input');
  const searchForm = document.querySelector('.form-search');
  const dataListFormSearch = document.querySelector('.form-search__data-list');
  const containerResultSearch = document.querySelector('.column-row');
  const resultSearchMovies = document.querySelector('.form-search__result-search-movies');
  const currentSearch = JSON.parse(localStorage.getItem('history'));

  // Состояние поиска
  const state = {
    lastSearch: [],
    currentSearch: {
      value: '',
      films: [],
    },
    visibleListSearch: false,
  };

  // Функция отрисовки при изменении состояния
  const render = () => {
    const lastSearch = watchedState.lastSearch;
    const { value, films } = watchedState.currentSearch;
    const visibleListSearch = watchedState.visibleListSearch;
    const latestSentences = lastSearch.map(({ value }) => value);
    const latests = value === '' ? latestSentences : latestSentences.filter((el) => el.includes(value));
    const setHints = new Set(latests.concat(films));
    const hints = Array.from(setHints).slice(0, 10).reverse();

    /* чтобы не прибегать к использованию всплытия/погружения 
        вешаем эту функцию на элементы с подсказками */
    const handler = (e) => {
      const value = e.target.textContent;
      searchInput.value = value;
      const input = new Event('input');
      searchInput.dispatchEvent(input);
      const submit = new Event('submit', { bubbles:true, cancelable:true });
      searchForm.dispatchEvent(submit);
    };

    //  отрисовка контейнера с подсказками
    const renderResultSearchMovies = () => {
      resultSearchMovies.innerHTML = '';
      hints.map((el) => {
        const div = document.createElement('div');
        div.textContent = el;
        div.classList.add('form-search__search-el');
        div.addEventListener('click', handler);
        return div;
      })
        .forEach((el) => {
          resultSearchMovies.append(el);
        });
    };

    // Создание и отрисовка дерева элементов с результатами трёх последних поисков
    const createSearchResultElements = () => {
      containerResultSearch.innerHTML = '';
      const f = (resultSearch) => {
        const { value, films } = resultSearch;
        const heading = document.createElement('h2');
        heading.classList.add('heading', 'heading_level-2');
        heading.textContent = `Search: ${value}`;
        containerResultSearch.append(heading);
        films.forEach((film) => {
          const { original_title, poster_path, release_date } = film;
          const column = document.createElement('div');
          column.classList.add('column', 'column_s-2', 'column_m-2', 'column_l-4');
          const movieCard = document.createElement('div');
          movieCard.classList.add('movie-card');
          const movieCardImageContainer = document.createElement('div');
          movieCardImageContainer.classList.add('movie-card__image-container');
          const movieCardImage = document.createElement('img');
          movieCardImage.classList.add('movie-card__image');
          const imgSrc = poster_path === null ? imgNotFound : `${pathImage}${poster_path}`;
          movieCardImage.src = imgSrc;
          const movieCardTitle = document.createElement('div');
          movieCardTitle.classList.add('movie-card__title');
          movieCardTitle.textContent = original_title;
          const movieCardYear = document.createElement('div');
          movieCardYear.classList.add('movie-card__year');
          const year = (new Date(release_date)).getFullYear();
          movieCardYear.textContent = Number.isNaN(year) ? '' : `(${year})`;
          movieCardImageContainer.append(movieCardImage);
          movieCard.append(movieCardImageContainer, movieCardTitle, movieCardYear);
          column.append(movieCard);
          containerResultSearch.append(column);
        });
      };
      watchedState.lastSearch.slice(0, 3).forEach(f);
    };

    // настраиваем отображение контейнера с подсказками
    const showListSearsh = () => {
      if (hints.length !== 0 && visibleListSearch) {
        searchInput.classList.add('form-search_input-buttom-radius-null');
        dataListFormSearch.classList.add('form-search__data-list_visible');
      } else {
        searchInput.classList.remove('form-search_input-buttom-radius-null');
        dataListFormSearch.classList.remove('form-search__data-list_visible');
      }
    };

    renderResultSearchMovies();
    showListSearsh();
    if (watchedState.lastSearch.length > 0) createSearchResultElements();
  };

  // Инициализация наблюдателя за состоянием
  const watchedState = onChange(state, () => {
    render();
  });

  watchedState.lastSearch = currentSearch === null ? [] : currentSearch;

  const getTitleList = async (url) => {
    const respose = await fetch(url);
    const films = await respose.json();
    return films.results.map(({ original_title }) => original_title);
  };

  const getListFilms = async (url) => {
    const respose = await fetch(url);
    const films = await respose.json();
    return films.results
      .map(({ original_title, poster_path, release_date }) => (
        { original_title, poster_path, release_date }));
  };

  //  отслеживаем изменения в поисковом поле и меняем состояние
  searchInput.addEventListener('input', async (e) => {
    const { value } = e.target;
    if (value === '') {
      watchedState.currentSearch = { value: '', films: [] };
      return;
    }
    const query = urlPathApi;
    query.searchParams.set('query', value);
    const titles = await getTitleList(query);
    const films = titles.filter((el) => !state.lastSearch.includes(el)).slice(0, 10);
    watchedState.currentSearch = { value, films };
  });

  // поиск запускается событием submit и изменяется соответсвующее состояние
  searchForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const value = formData.get('search');
    if (value === '') return;
    const query = urlPathApi;
    query.searchParams.set('query', value);
    const films = await getListFilms(query);
    const setLastSearch = [{ value, films }, ...watchedState.lastSearch
      .filter((el) => el.value !== value)];
    const lastSearch = setLastSearch.slice(0, 5);
    localStorage.setItem('history', JSON.stringify(lastSearch));
    watchedState.lastSearch = lastSearch;
  });

  // получение и потеря фокуса меняют состояние ответсвенное за отображение подсказок
  searchInput.addEventListener('focus', () => {
    watchedState.visibleListSearch = true;
  });

  searchInput.addEventListener('focusout', () => {
    // небольшой костыль позволяет прокликать подсказку
    setTimeout(() => { watchedState.visibleListSearch = false }, 200);
  });

  window.addEventListener('storage', () => {
    const history = JSON.parse(localStorage.getItem('history'));
    watchedState.lastSearch = history;
  });
};
