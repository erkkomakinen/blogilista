const mongoose = require('mongoose')
const supertest = require('supertest')
const helper = require('./test_helper')
const app = require('../app')
const bcrypt = require('bcrypt')

const Blog = require('../models/blog')
const User = require('../models/user')

const api = supertest(app)

beforeEach(async () => {
  await Blog.deleteMany({})
  await Blog.insertMany(helper.initialBlogs)

  await User.deleteMany({})
  await User.insertMany(helper.initialUsers)
  const passwordHash = await bcrypt.hash('salasana', 10)
  const user = new User({ username: 'root', passwordHash })
  await user.save()
})

test('blogs are returned as json', async () => {
  await api
    .get('/api/blogs')
    .expect(200)
    .expect('Content-Type', /application\/json/)
})

test('all blogs are returned', async () => {
  const response = await api.get('/api/blogs')

  expect(response.body).toHaveLength(helper.initialBlogs.length)
})

test('identifying field of blog documents is id', async () => {
  const response = await api.get('/api/blogs')
  const blogs = response.body
  blogs.forEach((blog) => {
    expect(blog.id).toBeDefined()
  })
})

test('a valid blog can be added', async () => {
  const logInUser = { username: 'root', password: 'salasana' }

  const logInResponse = await api
    .post('/api/login')
    .send(logInUser)
    .expect(200)
    .expect('Content-Type', /application\/json/)

  const token = logInResponse.body.token

  const newBlog = {
    title: 'Lisätty blogi',
    author: 'testi',
    url: 'asd.fi',
    likes: 4,
  }

  await api
    .post('/api/blogs')
    .send(newBlog)
    .set({ Authorization: `Bearer ${token}` })
    .expect(200)
    .expect('Content-Type', /application\/json/)

  const blogsAtEnd = await helper.blogsInDb()
  expect(blogsAtEnd.length).toBe(helper.initialBlogs.length + 1)

  const titles = blogsAtEnd.map((b) => b.title)
  expect(titles).toContain('Lisätty blogi')
})

test('a blog cannot be can be added without authorization', async () => {
  const newBlog = {
    title: 'Lisätty blogi',
    author: 'testi',
    url: 'asd.fi',
    likes: 4,
  }

  await api
    .post('/api/blogs')
    .send(newBlog)
    .expect(401)
    .expect('Content-Type', /application\/json/)

  const blogsAtEnd = await helper.blogsInDb()
  expect(blogsAtEnd.length).toBe(helper.initialBlogs.length)
})

test('if blogs field likes is undefined, set it to 0', async () => {
  const logInUser = { username: 'root', password: 'salasana' }

  const logInResponse = await api
    .post('/api/login')
    .send(logInUser)
    .expect(200)
    .expect('Content-Type', /application\/json/)

  const token = logInResponse.body.token

  const newBlog = {
    title: 'Undefined likes',
    author: 'testaaja',
    url: 'undefined.fi',
    //likes: 4,
  }

  await api
    .post('/api/blogs')
    .send(newBlog)
    .set({ Authorization: `Bearer ${token}` })
    .expect(200)
    .expect('Content-Type', /application\/json/)

  const blogs = await helper.blogsInDb()
  const latestBlog = blogs[blogs.length - 1]
  //console.log(latestBlog)
  expect(latestBlog.likes).toBe(0)
})

test('if the new blog does not include title and url, return status code 400', async () => {
  const logInUser = { username: 'root', password: 'salasana' }

  const logInResponse = await api
    .post('/api/login')
    .send(logInUser)
    .expect(200)
    .expect('Content-Type', /application\/json/)

  const token = logInResponse.body.token

  const newBlog = {
    //title: 'Blog without title',
    author: 'testaaja',
    //url: 'blank.fi',
    likes: 4,
  }

  await api
    .post('/api/blogs')
    .send(newBlog)
    .set({ Authorization: `Bearer ${token}` })
    .expect(400)
})

test('a blog can be deleted', async () => {
  const logInUser = { username: 'root', password: 'salasana' }

  const logInResponse = await api
    .post('/api/login')
    .send(logInUser)
    .expect(200)
    .expect('Content-Type', /application\/json/)

  const token = logInResponse.body.token

  const newBlog = {
    title: 'Poistettava blogi',
    author: 'testi',
    url: 'asd.fi',
    likes: 4,
  }

  await api
    .post('/api/blogs')
    .send(newBlog)
    .set({ Authorization: `Bearer ${token}` })
    .expect(200)
    .expect('Content-Type', /application\/json/)

  const blogsAfterAddingNew = await helper.blogsInDb()
  const blogToDelete = blogsAfterAddingNew[blogsAfterAddingNew.length - 1]

  await api
    .delete(`/api/blogs/${blogToDelete.id}`)
    .set({ Authorization: `Bearer ${token}` })
    .expect(204)

  const blogsAtEnd = await helper.blogsInDb()

  expect(blogsAtEnd.length).toBe(blogsAfterAddingNew.length - 1)

  const titles = blogsAtEnd.map((r) => r.title)
  expect(titles).not.toContain(blogToDelete.content)
})

test('a blog can be edited', async () => {
  const blogsAtStart = await helper.blogsInDb()
  const blogToEdit = blogsAtStart[0]

  const editedBlogObject = {
    title: 'PUT title',
    author: 'PUT author',
    url: 'PUT url.com',
    likes: 1000,
  }

  await api
    .put(`/api/blogs/${blogToEdit.id}`)
    .send(editedBlogObject)
    .expect(200)
    .expect('Content-Type', /application\/json/)

  const blogsAtEnd = await helper.blogsInDb()
  const editedBlog = blogsAtEnd[0]
  expect(editedBlog.title).toContain('PUT')
  expect(editedBlog.author).toContain('PUT')
  expect(editedBlog.url).toContain('PUT')
  expect(editedBlog.likes).toBe(1000)
})

describe('when there is initially one user at db', () => {
  test('creation succeeds with a fresh username', async () => {
    const usersAtStart = await helper.usersInDb()

    const newUser = {
      username: 'erlimaki',
      name: 'Erkko Mäkinen',
      password: 'salasana',
    }

    await api
      .post('/api/users')
      .send(newUser)
      .expect(200)
      .expect('Content-Type', /application\/json/)

    const usersAtEnd = await helper.usersInDb()
    expect(usersAtEnd).toHaveLength(usersAtStart.length + 1)

    const usernames = usersAtEnd.map((u) => u.username)
    expect(usernames).toContain(newUser.username)
  })

  test('creation fails when password is shorter than 3 characters', async () => {
    const usersAtStart = await helper.usersInDb()

    // password too short
    const newUser = {
      username: 'erlimaki',
      name: 'Erkko Mäkinen',
      password: 'sa',
    }

    const response = await api
      .post('/api/users')
      .send(newUser)
      .expect(400)
      .expect('Content-Type', /application\/json/)

    expect(response.body.error.toLowerCase()).toContain('password')

    const usersAtEnd = await helper.usersInDb()
    expect(usersAtEnd).toHaveLength(usersAtStart.length)
  })

  test('creation fails when username is shorter than 3 characters', async () => {
    const usersAtStart = await helper.usersInDb()

    // username too short
    const newUser = {
      username: 'er',
      name: 'Erkko Mäkinen',
      password: 'salasana',
    }

    const response = await api
      .post('/api/users')
      .send(newUser)
      .expect(400)
      .expect('Content-Type', /application\/json/)

    expect(response.body.error.toLowerCase()).toContain('username')

    const usersAtEnd = await helper.usersInDb()
    expect(usersAtEnd).toHaveLength(usersAtStart.length)
  })
})

afterAll(() => {
  mongoose.connection.close()
})
