import './index.css';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

const BASE_URL = 'https://suitmedia-backend.suitdev.com';

const FALLBACK_IMAGE = `data:image/svg+xml;base64,${btoa(`
  <svg xmlns="http://www.w3.org/2000/svg" width="400" height="300">
    <rect width="400" height="300" fill="#ccc"/>
    <text x="200" y="150" font-size="24" font-family="Arial" fill="#666" text-anchor="middle" alignment-baseline="middle">403 Forbiden Kak</text>
  </svg>
`)}`;

const App = () => {
  const getInitialParams = () => {
    const params = new URLSearchParams(window.location.search);
    return {
      page: parseInt(params.get('page')) || 1,
      size: parseInt(params.get('size')) || 10,
      sort: params.get('sort') || '-published_at',
    };
  };

  const { page: initialPage, size: initialSize, sort: initialSort } = getInitialParams();

  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [itemsPerPage, setItemsPerPage] = useState(initialSize);
  const [sortBy, setSortBy] = useState(initialSort);
  const [totalItems, setTotalItems] = useState(0);
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);

  const lastScrollY = useRef(0);
  const bannerRef = useRef(null);

  const updateURL = useCallback((page, size, sort) => {
    const params = new URLSearchParams();
    params.set('page', page);
    params.set('size', size);
    params.set('sort', sort);
    window.history.replaceState({}, '', `${window.location.pathname}?${params.toString()}`);
  }, []);

  const fetchPosts = useCallback(async (page, size, sort) => {
    setLoading(true);
    try {
      const query = new URLSearchParams({
        'page[number]': page,
        'page[size]': size,
        'sort': sort,
      });
      query.append('append[]', 'small_image');
      query.append('append[]', 'medium_image');

      const response = await fetch(`/api/ideas?${query.toString()}`, {
        method: 'GET',
        headers: { 
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('API Response:', data); 
      setPosts(data.data || []);
      setTotalItems(data.meta?.total || 0);
      updateURL(page, size, sort);
    } catch (err) {
      console.error('Error fetching posts:', err);
      setPosts([]);
      setTotalItems(0);
    } finally {
      setLoading(false);
    }
  }, [updateURL]);

  useEffect(() => {
    fetchPosts(currentPage, itemsPerPage, sortBy);
  }, [currentPage, itemsPerPage, sortBy, fetchPosts]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlPage = parseInt(params.get('page')) || 1;
    const urlSize = parseInt(params.get('size')) || 10;
    const urlSort = params.get('sort') || '-published_at';
    setCurrentPage(urlPage);
    setItemsPerPage(urlSize);
    setSortBy(urlSort);
  }, []);

  useEffect(() => {
    const onScroll = () => {
      const currentScrollY = window.scrollY;
      setIsHeaderVisible(currentScrollY <= lastScrollY.current || currentScrollY <= 100);
      lastScrollY.current = currentScrollY;
    };
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const onScroll = () => {
      if (bannerRef.current) {
        const scrolled = window.pageYOffset;
        bannerRef.current.style.transform = `translateY(${scrolled * 0.4}px)`;
      }
    };
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

 
  const getImageUrl = (post) => {
    const resolveUrl = (url) => {
      if (!url) return null;
      
      
      if (url.startsWith('http://') || url.startsWith('https://')) return url;
      
      
      return BASE_URL + url;
    };

    // Debug log to check image structure
    console.log('Post image data:', {
      small_image: post.small_image,
      medium_image: post.medium_image
    });

   
    if (post.small_image) {
      
      if (Array.isArray(post.small_image) && post.small_image[0]?.url) {
        return resolveUrl(post.small_image[0].url);
      }
      
      if (typeof post.small_image === 'string') {
        return resolveUrl(post.small_image);
      }
      
      if (post.small_image.url) {
        return resolveUrl(post.small_image.url);
      }
    }

    if (post.medium_image) {
      
      if (Array.isArray(post.medium_image) && post.medium_image[0]?.url) {
        return resolveUrl(post.medium_image[0].url);
      }
      
      if (typeof post.medium_image === 'string') {
        return resolveUrl(post.medium_image);
      }
     
      if (post.medium_image.url) {
        return resolveUrl(post.medium_image.url);
      }
    }

    
    if (post.image) {
      if (typeof post.image === 'string') {
        return resolveUrl(post.image);
      }
      if (post.image.url) {
        return resolveUrl(post.image.url);
      }
    }

    return null;
  };

 
  const LazyImage = ({ src, alt, className }) => {
    const [imageSrc, setImageSrc] = useState('');
    const [imageLoaded, setImageLoaded] = useState(false);
    const [imageError, setImageError] = useState(false);
    const imageRef = useRef(null);
    const retryCountRef = useRef(0);

    
    const validateImageUrl = (url) => {
      return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => resolve(true);
        img.onerror = () => resolve(false);
        img.src = url;
        
        
        setTimeout(() => resolve(false), 3000);
      });
    };

   
    const generateFallbackUrls = (originalUrl) => {
      if (!originalUrl) return [FALLBACK_IMAGE];
      
      const urls = [];
      
     
      if (originalUrl.includes('assets.suitdev.com')) {
       
        urls.push(originalUrl.replace('https://assets.suitdev.com', '/proxy-image'));
        
        urls.push(`https://images.weserv.nl/?url=${encodeURIComponent(originalUrl)}&w=400&h=300&fit=cover&output=webp`);
        urls.push(`https://wsrv.nl/?url=${encodeURIComponent(originalUrl)}&w=400&h=300&fit=cover`);
        
        urls.push(originalUrl);
      } else {
        
        urls.push(originalUrl);
      }
      
      urls.push(FALLBACK_IMAGE);
      
      return urls;
    };

    const loadImageWithFallback = async (url) => {
      const fallbackUrls = generateFallbackUrls(url);
      
      for (let i = 0; i < fallbackUrls.length; i++) {
        const testUrl = fallbackUrls[i];
        console.log(`Trying image URL ${i + 1}/${fallbackUrls.length}:`, testUrl);
        
        if (testUrl === imageSrc) continue;
        
        try {
          const isValid = await validateImageUrl(testUrl);
          if (isValid) {
            console.log('Successfully loaded:', testUrl);
            setImageSrc(testUrl);
            setImageError(false);
            return;
          }
        } catch (error) {
          console.log('Failed to load:', testUrl, error);
        }
      }
      
      // If all failed, use fallback
      console.log('All image URLs failed, using fallback');
      setImageSrc(FALLBACK_IMAGE);
      setImageError(true);
    };

    useEffect(() => {
      let observer;
      const el = imageRef.current;
      
      if (el && src && !imageSrc) {
        observer = new IntersectionObserver(
          (entries) => {
            entries.forEach(entry => {
              if (entry.isIntersecting) {
                loadImageWithFallback(src);
                observer.unobserve(el);
              }
            });
          },
          { threshold: 0.1 }
        );
        observer.observe(el);
      }
      
      return () => {
        if (observer) observer.disconnect();
      };
    }, [src, imageSrc]);

  
    useEffect(() => {
      if (src !== imageSrc) {
        setImageSrc('');
        setImageLoaded(false);
        setImageError(false);
        retryCountRef.current = 0;
      }
    }, [src]);

    const onError = (e) => {
      console.log('Image onError triggered:', e.target.src);
      setImageError(true);
      setImageLoaded(false);
      
      if (retryCountRef.current < 3) {
        retryCountRef.current++;
        setTimeout(() => {
          loadImageWithFallback(src);
        }, 1000);
      }
    };

    const onLoad = (e) => {
      console.log('Image loaded successfully:', e.target.src);
      setImageLoaded(true);
      setImageError(false);
    };

    return (
      <div ref={imageRef} className={`bg-gray-200 ${className}`}>
        {!imageLoaded && imageSrc && !imageError && (
          <div className="w-full h-full flex items-center justify-center bg-gray-300">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        )}
        {imageSrc && (
          <img
            src={imageSrc}
            alt={alt || 'Image'}
            onError={onError}
            onLoad={onLoad}
            className={`w-full h-full object-cover ${imageLoaded ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300`}
            loading="lazy"
            referrerPolicy="no-referrer"
            crossOrigin="anonymous"
          />
        )}
        {imageError && !imageLoaded && (
          <div className="w-full h-full flex items-center justify-center bg-gray-300">
            <span className="text-gray-500 text-sm">Image not available</span>
          </div>
        )}
      </div>
    );
  };

  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  const handlePageChange = (page) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleItemsPerPageChange = (size) => {
    const maxPage = Math.ceil(totalItems / size);
    const newPage = currentPage > maxPage ? maxPage : currentPage;
    setItemsPerPage(size);
    setCurrentPage(newPage);
  };

  const handleSortChange = (sort) => {
    const maxPage = Math.ceil(totalItems / itemsPerPage);
    const newPage = currentPage > maxPage ? maxPage : currentPage;
    setSortBy(sort);
    setCurrentPage(newPage);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className={`fixed top-0 left-0 right-0 z-50 transition-transform duration-300 ${isHeaderVisible ? 'translate-y-0' : '-translate-y-full'} bg-orange-500/90 backdrop-blur-md`}>
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-2">
              <img
                src="/site-logo.webp"
                alt="Suitmedia Logo"
                className="w-28 h-37 object-contain drop-shadow-[0_0_4px_white]"
              />
            </div>
            <nav className="hidden md:flex items-center space-x-8">
              {[{ name: 'Work', href: '/work' }, { name: 'About', href: '/about' }, { name: 'Services', href: '/services' }, { name: 'Ideas', href: '/ideas' }, { name: 'Careers', href: '/careers' }, { name: 'Contact', href: '/contact' }].map(({ name, href }) => (
                <a
                  key={href}
                  href={href}
                  className={`text-white hover:text-orange-200 transition-colors pb-4 ${window.location.pathname === href ? 'border-b-2 border-white' : ''}`}
                >
                  {name}
                </a>
              ))}
            </nav>
          </div>
        </div>
      </header>

      {/* Banner */}
      <div className="relative h-[450px] overflow-hidden">
        <img
          ref={bannerRef}
          src={`${BASE_URL}/storage/ideas-banner.jpg`}
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = '/ideas-idea-vision-design-plan-objective-mission-concept.jpg';
          }}
          alt="Ideas Banner"
          className="absolute inset-0 w-full h-full object-cover will-change-transform"
        />

        <div className="absolute inset-0 bg-gradient-to-b from-black/40 to-black/80 z-10" />

        <div className="relative z-20 h-full flex flex-col items-center justify-center text-white text-center px-4">
          <h1 className="text-5xl md:text-5xl mb-1">Ideas</h1>
          <p className="text-base md:text-lg max-w-xl">Where all our great things begin</p>
        </div>

        <div
          className="absolute bottom-0 left-0 w-full h-28 bg-white z-20"
          style={{ clipPath: 'polygon(0 99.9%, 100% 0, 100% 101%, 0 101%)' }}
        />
      </div>


      {/* Main */}
      <main className="max-w-7xl mx-auto px-4 py-12">
        {/* Controls */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-5">
          <p className="text-sm text-gray-1000">
            Showing {startItem} - {endItem} of {totalItems}
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600 font-semibold">Show per page:</label>
              <select
                value={itemsPerPage}
                onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
                className="text-sm border border-gray-300 rounded-full px-5 py-3 min-w-[120px] font-semibold"
              >
                {[10, 20, 50].map(size => (
                  <option key={size} value={size}>{size}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-800 font-semibold">Sort by:</label>
              <select 
                value={sortBy}
                onChange={(e) => handleSortChange(e.target.value)}
                className="text-sm border border-gray-300 rounded-full px-3 py-3 min-w-[160px] font-semibold"
              >
                <option value="-published_at">Newest</option>
                <option value="published_at">Oldest</option>
              </select>
            </div>
          </div>
        </div>

        {/* Posts */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-y-10 gap-x-7">
            {[...Array(itemsPerPage)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg shadow p-4 animate-pulse">
                <div className="aspect-[4/3] bg-gray-200 mb-4 rounded"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-full"></div>
              </div>
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-500 text-lg">No posts found</div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-y-10 gap-x-7">
            {posts.map(post => {
              const imageUrl = getImageUrl(post);
              console.log('Post:', post.id, 'Image URL:', imageUrl); 
              
              return (
                <article
                  key={post.id}
                  className="bg-white rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden flex flex-col"
                >
                  <div className="aspect-[4/3] relative bg-gray-100">
                    <LazyImage 
                      src={imageUrl} 
                      alt={post.title || 'Post image'} 
                      className="w-full h-full" 
                    />
                  </div>
                  <div className="p-4 flex flex-col flex-grow">
                    <time
                      dateTime={post.published_at}
                      className="text-[13px] text-gray-400 font-semibold mb-1 uppercase tracking-wide"
                    >
                      {post.published_at ? new Date(post.published_at).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      }) : 'No date'}
                    </time>
                    <h3 className="text-base font-semibold text-gray-800 line-clamp-3 leading-snug mt-[5px]" title={post.title}>
                      {post.title || 'Untitled'}
                    </h3>
                  </div>
                </article>
              );
            })}
          </div>
        )}

          {/* Pagination */}
          {totalPages > 1 && (
          <nav aria-label="Pagination" className="flex justify-center mt-10 gap-0" role="navigation">
            {/* First Page */}
            <button
              onClick={() => handlePageChange(1)}
              disabled={currentPage === 1}
              aria-label="First page"
              className="w-10 h-12 flex items-center justify-center hover:bg-gray-100 disabled:opacity-50 font-semibold"
            >
              <ChevronsLeft className="w-4 h-4" />
            </button>

            {/* Previous Page */}
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              aria-label="Previous page"
              className="w-10 h-12 flex items-center justify-center hover:bg-gray-100 disabled:opacity-50"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {/* Page Numbers */}
            {[...Array(Math.min(5, totalPages))].map((_, index) => {
              let pageNum = index + 1;
              if (totalPages > 5 && currentPage > 3) {
                pageNum = currentPage + index - 2;
                if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + index;
                }
              }

              if (pageNum < 1 || pageNum > totalPages) return null;

              return (
                <button
                  key={pageNum}
                  onClick={() => handlePageChange(pageNum)}
                  aria-current={currentPage === pageNum ? 'page' : undefined}
                  className={`w-10 h-12 flex items-center justify-center rounded-xl border transition-colors ${
                    currentPage === pageNum
                      ? 'bg-orange-500 text-white'
                      : 'border-none hover:bg-gray-100'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}

            {/* Next Page */}
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              aria-label="Next page"
              className="w-10 h-12 flex items-center justify-center hover:bg-gray-100 disabled:opacity-50"
            >
              <ChevronRight className="w-5 h-5" />
            </button>

            {/* Last Page */}
            <button
              onClick={() => handlePageChange(totalPages)}
              disabled={currentPage === totalPages}
              aria-label="Last page"
              className="w-10 h-12 flex items-center justify-center hover:bg-gray-100 disabled:opacity-50 font-semibold"
            >
              <ChevronsRight className="w-5 h-5" />
            </button>
          </nav>
        )}
      </main>
    </div>
  );
};

export default App;