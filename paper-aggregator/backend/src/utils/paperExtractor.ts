import axios from 'axios';
import * as cheerio from 'cheerio';
import { PaperMetadata } from '../types';

export async function extractPaperMetadata(url: string): Promise<PaperMetadata> {
  try {
    // Check if it's an ePrint IACR paper
    if (url.includes('eprint.iacr.org')) {
      return await extractEprintMetadata(url);
    }

    // Check if it's an arXiv paper
    if (url.includes('arxiv.org')) {
      return await extractArxivMetadata(url);
    }

    // Check if it's a DOI link
    if (url.includes('doi.org')) {
      return await extractDoiMetadata(url);
    }

    // Fallback: Try to extract from webpage
    return await extractFromWebpage(url);
  } catch (error) {
    console.error('Error extracting paper metadata:', error);
    return {
      title: 'Unable to extract title',
      abstract: undefined,
      bib_entry: undefined,
      authors: undefined,
      published_date: undefined
    };
  }
}

async function extractEprintMetadata(url: string): Promise<PaperMetadata> {
  // Extract paper ID from URL (e.g., 2025/2097)
  const eprintIdMatch = url.match(/eprint\.iacr\.org\/(\d{4}\/\d+)/);
  if (!eprintIdMatch) {
    throw new Error('Invalid ePrint IACR URL');
  }

  const eprintId = eprintIdMatch[1];
  const paperUrl = `https://eprint.iacr.org/${eprintId}`;

  const response = await axios.get(paperUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }
  });

  const $ = cheerio.load(response.data);

  // Extract title
  const title = $('meta[name="citation_title"]').attr('content') ||
                $('h1').first().text().trim() ||
                'Unknown Title';

  // Extract authors
  const authorElements = $('meta[name="citation_author"]');
  const authors = authorElements
    .map((_, el) => $(el).attr('content'))
    .get()
    .join(' and ');

  // Extract abstract - try multiple selectors for ePrint IACR
  let abstract = $('meta[name="citation_abstract"]').attr('content');

  if (!abstract) {
    // Try to find abstract in definition list
    $('dt').each((_, el) => {
      const dt = $(el);
      if (dt.text().toLowerCase().includes('abstract')) {
        const dd = dt.next('dd');
        if (dd.length) {
          abstract = dd.text().trim();
        }
      }
    });
  }

  // Fallback to other common selectors
  if (!abstract) {
    abstract = $('#abstract').text().trim() ||
               $('blockquote').first().text().trim() ||
               $('.abstract').text().trim();
  }

  // Extract publication date
  const dateStr = $('meta[name="citation_publication_date"]').attr('content') ||
                  $('meta[name="citation_online_date"]').attr('content');
  const published_date = dateStr || eprintId.split('/')[0]; // Use year from ID as fallback

  // Extract BibTeX - look for BibTeX section
  let bib_entry = '';

  // Try to find BibTeX in the page
  $('dt').each((_, el) => {
    const dt = $(el);
    if (dt.text().includes('BibTeX')) {
      const dd = dt.next('dd');
      if (dd.length) {
        const preContent = dd.find('pre').text().trim();
        if (preContent) {
          bib_entry = preContent;
        }
      }
    }
  });

  // If BibTeX not found in page, generate it
  if (!bib_entry) {
    const year = eprintId.split('/')[0];
    const firstAuthorLastName = authors ? authors.split(' and ')[0].split(' ').pop() : 'unknown';
    const bibKey = `cryptoeprint:${eprintId.replace('/', ':')}`;

    bib_entry = `@misc{${bibKey},
      author = {${authors || 'Unknown'}},
      title = {${title}},
      howpublished = {Cryptology {ePrint} Archive, Paper ${eprintId}},
      year = {${year}},
      url = {https://eprint.iacr.org/${eprintId}}
}`;
  }

  return {
    title,
    abstract: abstract || undefined,
    bib_entry,
    authors: authors || undefined,
    published_date
  };
}

async function extractArxivMetadata(url: string): Promise<PaperMetadata> {
  // Extract arXiv ID from URL
  const arxivIdMatch = url.match(/(?:arxiv\.org\/abs\/|arxiv\.org\/pdf\/)(\d+\.\d+)/);
  if (!arxivIdMatch) {
    throw new Error('Invalid arXiv URL');
  }

  const arxivId = arxivIdMatch[1];
  const apiUrl = `http://export.arxiv.org/api/query?id_list=${arxivId}`;

  const response = await axios.get(apiUrl);
  const $ = cheerio.load(response.data, { xmlMode: true });

  const entry = $('entry').first();
  const title = entry.find('title').text().trim().replace(/\s+/g, ' ');
  const abstract = entry.find('summary').text().trim().replace(/\s+/g, ' ');
  const authors = entry.find('author name').map((_, el) => $(el).text()).get().join(' and ');
  const published = entry.find('published').text().split('T')[0];

  // Generate BibTeX entry
  const year = published.split('-')[0];
  const firstAuthorLastName = authors.split(' and ')[0].split(' ').pop() || 'Unknown';
  const bibKey = `${firstAuthorLastName.toLowerCase()}${year}${arxivId.replace('.', '')}`;

  const bibEntry = `@article{${bibKey},
  title={${title}},
  author={${authors}},
  journal={arXiv preprint arXiv:${arxivId}},
  year={${year}}
}`;

  return {
    title,
    abstract,
    bib_entry: bibEntry,
    authors,
    published_date: published
  };
}

async function extractDoiMetadata(url: string): Promise<PaperMetadata> {
  // Extract DOI from URL
  const doiMatch = url.match(/doi\.org\/(.+)/);
  if (!doiMatch) {
    throw new Error('Invalid DOI URL');
  }

  const doi = doiMatch[1];

  // Use CrossRef API
  const apiUrl = `https://api.crossref.org/works/${doi}`;
  const response = await axios.get(apiUrl);
  const data = response.data.message;

  const title = data.title?.[0] || 'Unknown Title';
  const abstract = data.abstract || undefined;
  const authors = data.author?.map((a: any) => `${a.given} ${a.family}`).join(' and ');
  const published = data.published?.['date-parts']?.[0]?.join('-');

  // Generate BibTeX
  const year = published?.split('-')[0] || 'Unknown';
  const firstAuthorLastName = data.author?.[0]?.family || 'Unknown';
  const bibKey = `${firstAuthorLastName.toLowerCase()}${year}`;

  const containerTitle = data['container-title']?.[0] || 'Unknown Journal';
  const volume = data.volume || '';
  const pages = data.page || '';

  const bibEntry = `@article{${bibKey},
  title={${title}},
  author={${authors || 'Unknown'}},
  journal={${containerTitle}},
  ${volume ? `volume={${volume}},` : ''}
  ${pages ? `pages={${pages}},` : ''}
  year={${year}},
  doi={${doi}}
}`;

  return {
    title,
    abstract,
    bib_entry: bibEntry,
    authors,
    published_date: published
  };
}

async function extractFromWebpage(url: string): Promise<PaperMetadata> {
  const response = await axios.get(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }
  });

  const $ = cheerio.load(response.data);

  // Try to extract title from meta tags or h1
  let title = $('meta[name="citation_title"]').attr('content') ||
              $('meta[property="og:title"]').attr('content') ||
              $('h1').first().text().trim() ||
              $('title').text().trim();

  // Try to extract abstract
  const abstract = $('meta[name="citation_abstract"]').attr('content') ||
                   $('meta[name="description"]').attr('content') ||
                   $('meta[property="og:description"]').attr('content');

  // Try to extract authors
  const authors = $('meta[name="citation_author"]')
    .map((_, el) => $(el).attr('content'))
    .get()
    .join(' and ');

  // Try to extract publication date
  const published_date = $('meta[name="citation_publication_date"]').attr('content') ||
                         $('meta[property="article:published_time"]').attr('content');

  return {
    title: title || 'Unable to extract title',
    abstract: abstract || undefined,
    bib_entry: undefined,
    authors: authors || undefined,
    published_date: published_date || undefined
  };
}
