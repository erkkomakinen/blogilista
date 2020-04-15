const dummy = (blogs) => {
  return 1
}

const totalLikes = (blogs) => {
  return blogs.reduce((likes, blog) => {
    return likes + blog.likes
  }, 0)
}

const favoriteBlog = (blogs) => {
  const mostLikes = Math.max.apply(
    Math,
    blogs.map((blog) => blog.likes)
  )
  return blogs.length === 0 ? {} : blogs.find((blog) => blog.likes === mostLikes)
}

const mostBlogs = (blogs) => {
  const blogsPerAuthor = blogs.reduce((authors, blog) => {
    //console.log(authors)
    return { ...authors, [blog.author]: (authors[blog.author] || 0) + 1 }
  }, {})

  const mostBlogsCount = Math.max(...Object.values(blogsPerAuthor))

  const authorWithMostBlogs = Object.keys(blogsPerAuthor).find((key) => blogsPerAuthor[key] === mostBlogsCount)

  const mostBlogs = {
    author: authorWithMostBlogs,
    blogs: mostBlogsCount,
  }

  return blogs.length === 0 ? {} : mostBlogs
}

const mostLikes = (blogs) => {
  const likesPerAuthor = blogs.reduce((authors, blog) => {
    //console.log(authors)
    return { ...authors, [blog.author]: (authors[blog.author] || 0) + blog.likes }
  }, {})

  const mostLikesCount = Math.max(...Object.values(likesPerAuthor))

  const authorWithMostLikes = Object.keys(likesPerAuthor).find((key) => likesPerAuthor[key] === mostLikesCount)

  const mostLikes = {
    author: authorWithMostLikes,
    likes: mostLikesCount,
  }

  return blogs.length === 0 ? {} : mostLikes
}

module.exports = {
  dummy,
  totalLikes,
  favoriteBlog,
  mostBlogs,
  mostLikes,
}
