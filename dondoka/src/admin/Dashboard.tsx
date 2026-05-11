import "./Dashboard.css";

export default function Dashboard() {



    return (
        <>
            <div className="container-grid-dashboard">

                <div className="card">
                    <span>Produtos</span>
                    <strong>0</strong>
                </div>

                <div className="card">
                    <span>Clientes</span>
                    <strong>0</strong>
                </div>

                <div className="card">
                    <span>Pedidos</span>
                    <strong>0</strong>
                </div>

                <div className="card">
                    <span>Usuários</span>
                    <strong>0</strong>
                </div>

            </div>
            <div className="dashboard-tables">

                <div className="table-card">
                    <h4>Últimos produtos cadastrados</h4>

                    <table>
                        <thead>
                            <tr>
                                <th>Nome</th>
                                <th>Preço</th>
                                <th>Status</th>
                            </tr>
                        </thead>

                        <tbody>
                            <tr>
                                <td>Produto A</td>
                                <td>R$ 100</td>
                                <td>Ativo</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <div className="table-card">
                    <h4>Novos clientes cadastrados</h4>

                    <table>
                        <thead>
                            <tr>
                                <th>Nome</th>
                                <th>Email</th>
                                <th>Data</th>
                            </tr>
                        </thead>

                        <tbody>
                            <tr>
                                <td>João</td>
                                <td>joao@email.com</td>
                                <td>10/05</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                <div className="table-card">
                    <h4>Últimos pedidos realizados</h4>

                    <table>
                        <thead>
                            <tr>
                                <th>Nome</th>
                                <th>Email</th>
                                <th>Data</th>
                            </tr>
                        </thead>

                        <tbody>
                            <tr>
                                <td>João</td>
                                <td>joao@email.com</td>
                                <td>10/05</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

            </div>
        </>
    );
}