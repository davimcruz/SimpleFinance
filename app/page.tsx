/**
 * @swagger
 * /api/register:
 *   post:
 *     summary: Registrar um novo usuário.
 *     description: Endpoint para registrar um novo usuário na aplicação.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 format: password
 *     responses:
 *       201:
 *         description: Usuário registrado com sucesso.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Usuário registrado com sucesso
 *       400:
 *         description: Email já registrado.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Email já registrado
 *       500:
 *         description: Erro ao processar a requisição.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Erro ao processar a requisição
 */
export default function LayoutPage() {
  return (
    <div className="flex min-h-screen bg-slate-50 md:items-center justify-center"></div>
  )
}
