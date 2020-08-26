const form = document.querySelector('form')
form.addEventListener('submit', async (event) => {
  event.preventDefault()
  const response = await fetch('/import', {
    method: 'post',
    body: new FormData(form)
  })
  const responseText = await response.text()
})

