
const errorMessageElement = document.getElementById('error-message');
const totalFoundElement = document.getElementById('total-found');
const searchResultElement = document.getElementById('search-result');
const loadingElement = document.getElementById('loading');
const searchField = document.getElementById('search-field');
const loadMoreContainer = document.getElementById('load-more-container');
const loadMoreBtn = document.getElementById('load-more-btn');

let allBookDocs = []; 
let currentBooksOffset = 0; 
const booksPerPage = 20;
const loadingDisplay = (isLoading) => {
  loadingElement.style.display = isLoading ? 'block' : 'none';
};

const searchResultDisplay = (isVisible) => {
};

const clearMessages = () => {
  errorMessageElement.innerHTML = '';
  totalFoundElement.innerHTML = '';
};

const clearSearch = () => {
  searchField.value = '';
  clearMessages();
  searchResultElement.innerHTML = '';
  allBookDocs = [];
  currentBooksOffset = 0;
  loadMoreContainer.style.display = 'none';
  searchField.focus();
};

const loadGenre = (genre) => {
  const formattedGenre = genre.replace(/_/g, ' ');
  searchField.value = formattedGenre;
  
  allBookDocs = []; 
  currentBooksOffset = 0;
  searchResultElement.innerHTML = ''; 
  loadData();
  const searchContainer = document.querySelector('.search-container');
  if (searchContainer) {
    searchContainer.scrollIntoView({ behavior: 'smooth' });
  }
};

const loadData = () => {
  const inputValue = searchField.value.trim();
  
  if (currentBooksOffset === 0) {
    clearMessages();
    searchResultElement.innerHTML = '';
    allBookDocs = [];
  }

  if (inputValue === '') {
    errorMessageElement.innerHTML = `<p class="text-warning">Please enter a book name, keyword, or select a genre.</p>`;
    loadMoreContainer.style.display = 'none';
    return;
  }

  loadingDisplay(true);
  loadMoreContainer.style.display = 'none';

  const url = `https://openlibrary.org/search.json?q=${encodeURIComponent(inputValue)}`;

  fetch(url)
    .then(res => {
      if (!res.ok) {
        throw new Error(`API request failed with status: ${res.status}`);
      }
      return res.json();
    })
    .then(data => {
      allBookDocs = data.docs || []; 
      currentBooksOffset = 0; 
      searchResultElement.innerHTML = ''; 
      displayBooksBatch(data.numFound, inputValue);
    })
    .catch(error => {
      console.error("Fetch error:", error);
      errorMessageElement.innerHTML = `<p class="text-danger">Could not fetch data. The API might be down or your query is invalid. Please try again later.</p>`;
      loadingDisplay(false);
    });
};

const displayBooksBatch = (totalNumFound, query) => {
  loadingDisplay(false);

  if (currentBooksOffset === 0) { 
    if (!allBookDocs || allBookDocs.length === 0) {
      totalFoundElement.innerHTML = `<p>No results found for "${query}".</p>`;
      loadMoreContainer.style.display = 'none';
      return;
    }
    totalFoundElement.innerHTML = `<p class="text-success">Found approximately ${totalNumFound} results for "${query}".</p>`;
  }
  
  const booksToDisplay = allBookDocs.slice(currentBooksOffset, currentBooksOffset + booksPerPage);

  if (booksToDisplay.length === 0 && currentBooksOffset === 0) {
     searchResultElement.innerHTML = ''; 
     loadMoreContainer.style.display = 'none';
     return;
  }

  booksToDisplay.forEach(book => {
    const cardDiv = document.createElement('div');
    cardDiv.classList.add('col');

    const coverId = book.cover_i;
    const coverUrl = coverId 
      ? `https://covers.openlibrary.org/b/id/${coverId}-M.jpg` 
      : 'https://via.placeholder.com/300x450.png?text=No+Cover';

    const title = book.title ? book.title : 'Title Unknown';
    const authorNames = book.author_name ? book.author_name.join(', ') : 'Author Unknown';
    const firstPublishYear = book.first_publish_year ? book.first_publish_year : 'N/A';
    const publisher = book.publisher && book.publisher.length > 0 ? book.publisher[0] : 'Publisher Unknown';

    let actionButtonHtml = '';
    const bookKey = book.key; 

    if ((book.ebook_access === 'public' || book.ebook_access === 'borrowable') && book.ia && book.ia[0]) {
      actionButtonHtml = `<a href="https://archive.org/details/${book.ia[0]}" target="_blank" class="btn btn-sm btn-primary mt-auto w-100">Read on Archive.org</a>`;
    } else if (bookKey) {
      actionButtonHtml = `<a href="https://openlibrary.org${bookKey}" target="_blank" class="btn btn-sm btn-outline-secondary mt-auto w-100">More Info on OpenLibrary</a>`;
    } else {
      actionButtonHtml = `<p class="text-muted mt-auto small">No direct reading link available.</p>`
    }

    cardDiv.innerHTML = `
      <div class="card h-100 book-card">
        <img src="${coverUrl}" class="card-img-top" alt="Cover of ${title}" style="height: 300px; object-fit: cover;">
        <div class="card-body d-flex flex-column">
          <h5 class="card-title" title="${title}">${title.length > 50 ? title.substring(0, 50) + '...' : title}</h5>
          <p class="card-text small mb-1"><strong>Author(s):</strong> ${authorNames.length > 40 ? authorNames.substring(0, 40) + '...' : authorNames}</p>
          <p class="card-text small mb-1"><strong>First Published:</strong> ${firstPublishYear}</p>
          <p class="card-text small mb-2"><strong>Publisher:</strong> ${publisher.length > 30 ? publisher.substring(0, 30) + '...' : publisher}</p>
          <div class="mt-auto"> 
            ${actionButtonHtml}
          </div>
        </div>
      </div>
    `;
    searchResultElement.appendChild(cardDiv);
  });

  currentBooksOffset += booksToDisplay.length;

  if (currentBooksOffset < allBookDocs.length) {
    loadMoreContainer.style.display = 'block';
    if(currentBooksOffset === 0 && booksToDisplay.length > 0) { 
         totalFoundElement.innerHTML += ` <small>(Showing first ${booksToDisplay.length} of ${allBookDocs.length})</small>`;
    } else if (booksToDisplay.length > 0) {
         totalFoundElement.innerHTML = `<p class="text-success">Showing ${currentBooksOffset} of ${allBookDocs.length} results for "${searchField.value.trim()}".</p>`;
    }
  } else {
    loadMoreContainer.style.display = 'none';
    if (allBookDocs.length > 0) {
        totalFoundElement.innerHTML = `<p class="text-success">Showing all ${allBookDocs.length} results for "${searchField.value.trim()}".</p>`;
    }
  }
   if (searchResultElement.children.length > 0) {
        searchResultElement.style.display = 'flex';
    } else {
        searchResultElement.style.display = 'none';
    }
};
//

loadMoreBtn.addEventListener('click', () => {
    displayBooksBatch(allBookDocs.length, searchField.value.trim());
});

searchField.addEventListener('keypress', function(event) {
    if (event.key === 'Enter') {
        event.preventDefault(); 
        currentBooksOffset = 0; 
        searchResultElement.innerHTML = '';
        loadData();
    }

});
